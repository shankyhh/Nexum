import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/config';
import { AiMessage } from '../types';
import { prisma } from '../prisma';
const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are NEXUM AI, an expert Indian tax and compliance assistant integrated into the NEXUM platform. You have deep knowledge of:
- GST laws (CGST Act, IGST Act, UTGST Act, relevant notifications and circulars)
- Income Tax Act, 1961 (deductions, exemptions, tax slabs for AY 2025-26)
- DPDP Act 2023 and Digital Personal Data Protection Rules 2025
- CA practice management and client data governance
Always provide practical, actionable guidance. Cite relevant sections when applicable. Format responses clearly with sections when helpful.`,

  gst: `You are NEXUM GST Assistant, an expert in Indian GST law. You help users with:
- GSTR-1, GSTR-3B, GSTR-9 filing
- ITC reconciliation and eligibility (Sections 16, 17, 18)
- E-invoicing and e-way bill compliance
- GST audit and notices under Section 73/74
- Place of supply rules (Sections 10-13)
- Reverse charge mechanism
- Composition scheme eligibility
Always cite the relevant CGST/IGST section or notification. For AY 2025-26 data, reference latest CBIC circulars.`,

  itr: `You are NEXUM Income Tax Assistant, an expert in Indian income tax. You help users with:
- ITR-1 (Sahaj), ITR-2, ITR-3, ITR-4 filing guidance
- Tax slabs for AY 2025-26 (old vs new regime comparison)
- Deductions: 80C (₹1.5L), 80D (medical), 80G (donations), 80EE (home loan), 87A rebate
- Capital gains: STCG (15%/special rates), LTCG (10% above ₹1L for equity; 20% with indexation)
- TDS, advance tax, self-assessment tax
- Section 10 exemptions (HRA, LTA, gratuity)
Provide regime comparisons when relevant. Cite Income Tax Act sections precisely.`,

  vaultiq: `You are NEXUM VAULTIQ Assistant, an expert in client data governance and DPDP compliance for CA/law firms. You help with:
- DPDP Act 2023 obligations: §5 notice, §8 accountability, §8(7) storage limitation
- Data classification: Public, Internal, Confidential, Restricted, Highly Restricted
- Document lifecycle management: collection → storage → sharing → retention → deletion
- Sensitive data points (Aadhaar, Passport, biometric, medical) — special safeguards
- Access control matrices, data processing agreements, data sharing logs
- Retention rules: PAN/Bank (6 yrs), Financials/Director (8 yrs), Aadhaar (delete after use)
Always reference the relevant DPDP section. Provide practical compliance steps.`,
};

function generateTitle(message: string): string {
  const trimmed = message.substring(0, 60);
  return trimmed.length < message.length ? trimmed + '...' : trimmed;
}

export const aiService = {
  async chat(userId: string, message: string, module = 'general', conversationId?: string) {
    // Load or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId },
      });
    }

    const history: AiMessage[] = conversation
      ? (conversation.messages as unknown as AiMessage[])
      : [];

    // Append user message
    const userMsg: AiMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    history.push(userMsg);

    // Build messages for Claude (omit timestamps)
    const claudeMessages = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const systemPrompt = SYSTEM_PROMPTS[module] || SYSTEM_PROMPTS.general;

    let reply = '';
    try {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages,
      });

      reply = response.content[0].type === 'text' ? response.content[0].text : 'Sorry, I could not generate a response.';
    } catch (err) {
      console.error('[AI] Claude API error:', err);
      reply = 'I encountered an error connecting to the AI service. Please check your API key configuration and try again.';
    }

    // Append assistant message
    const assistantMsg: AiMessage = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
    history.push(assistantMsg);

    // Save conversation
    if (conversation) {
      await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: { messages: history as object[], updatedAt: new Date() },
      });
      return { reply, conversationId: conversation.id };
    } else {
      const newConv = await prisma.aiConversation.create({
        data: {
          userId,
          title: generateTitle(message),
          messages: history as object[],
          module,
        },
      });
      return { reply, conversationId: newConv.id, title: newConv.title };
    }
  },

  async getConversations(userId: string) {
    return prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, module: true, createdAt: true, updatedAt: true },
    });
  },

  async getConversation(id: string, userId: string) {
    const conv = await prisma.aiConversation.findFirst({ where: { id, userId } });
    if (!conv) return null;
    return conv;
  },

  async deleteConversation(id: string, userId: string) {
    const conv = await prisma.aiConversation.findFirst({ where: { id, userId } });
    if (!conv) return false;
    await prisma.aiConversation.delete({ where: { id } });
    return true;
  },
};
