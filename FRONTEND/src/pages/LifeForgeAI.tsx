import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send, ArrowLeft, Heart, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const SYSTEM_PROMPT = `You are LifeForge AI Companion, an intelligent assistant integrated into LifeForge Connect, a unified donor-recipient platform for blood, platelets, bone marrow, organs, plasma, and human milk.

Your purpose is to:
- Help users understand donation types and eligibility.
- Explain compatibility concepts clearly (e.g., blood groups, HLA basics).
- Guide donors and recipients through safe, verified procedures.
- Provide emergency-aware responses when urgency is detected.
- Promote ethical, legal, and medically responsible information.

You must follow these rules strictly:
1. Do NOT provide medical diagnosis, treatment, or personalized clinical decisions. Always recommend consulting certified medical professionals for medical emergencies.
2. If a user message indicates urgency (e.g., "ICU", "critical", "urgent", "emergency"), respond calmly and clearly. Emphasize contacting emergency services or the nearest hospital immediately before using the platform.
3. Provide factual, evidence-based information in simple language. Avoid technical jargon unless explaining it clearly.
4. Never fabricate statistics, availability data, or specific hospital affiliations. If unsure, say: "I do not have access to real-time medical databases. Please verify with an authorized medical center."
5. Never collect or request sensitive personal data such as full medical records, Aadhaar numbers, detailed health history, or exact home addresses.
6. Maintain a compassionate and supportive tone. You are assisting in life-sensitive situations.
7. When explaining compatibility, clarify basic matching principles and emphasize that final compatibility must be confirmed through clinical testing.
8. Encourage voluntary, ethical, and legal donation practices only. Never suggest illegal organ trade or unsafe donation methods.

Your tone should be: Calm, trustworthy, structured, and supportive. You help users navigate life-saving systems responsibly and safely. Keep responses concise and clear — use bullet points where helpful. Never be overly verbose.`;

const URGENCY_KEYWORDS = ["emergency", "urgent", "critical", "icu", "bleeding heavily", "dying", "immediate"];

const QUICK_PROMPTS = [
    { label: "🩸 Blood Donation", text: "How do I donate blood and what are the eligibility criteria?" },
    { label: "🧬 Bone Marrow", text: "How does bone marrow donation work and how can I register?" },
    { label: "🫀 Organ Donation", text: "How do I register as an organ donor in India?" },
    { label: "🍼 Milk Donation", text: "How can I donate breast milk and what are the requirements?" },
    { label: "🔬 Compatibility", text: "Can you explain blood group compatibility in simple terms?" },
    { label: "⚡ Platelet Donation", text: "What is platelet donation and who needs it most?" },
];

function TypingIndicator() {
    return (
        <div className="flex items-center gap-1.5 py-3 px-4">
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    animate={{
                        y: [0, -6, 0],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.2,
                    }}
                    className="w-2 h-2 rounded-full bg-primary"
                />
            ))}
        </div>
    );
}

interface MessageProps {
    msg: {
        role: "user" | "assistant";
        content: string;
        isEmergency?: boolean;
    };
}

function Message({ msg }: MessageProps) {
    const isUser = msg.role === "user";
    const isEmergency = msg.isEmergency;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex mb-6 ${isUser ? "justify-end" : "justify-start"}`}
        >
            {!isUser && (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white mr-3 mt-1 shrink-0 shadow-lg shadow-primary/20">
                    <Heart size={18} fill="currentColor" />
                </div>
            )}
            <div
                className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser
                        ? "bg-gradient-to-br from-primary to-primary-dark text-white rounded-tr-none shadow-md shadow-primary/10"
                        : isEmergency
                            ? "bg-[#1a0a0a] border border-primary/40 text-rose-50 rounded-tl-none shadow-xl shadow-primary/20"
                            : "bg-white dark:bg-muted/30 border border-border text-foreground rounded-tl-none shadow-sm"
                    }`}
            >
                {isEmergency && (
                    <div className="text-primary font-bold text-[10px] tracking-widest uppercase mb-2 flex items-center gap-1.5 animate-pulse">
                        <span className="text-sm">🚨</span> HIGH URGENCY DETECTED
                    </div>
                )}
                {msg.content}
            </div>
        </motion.div>
    );
}

export default function LifeForgeAI() {
    const [messages, setMessages] = useState<MessageProps["msg"][]>([
        {
            role: "assistant",
            content: "Hello, I'm LifeForge AI — your guide through India's life-saving donor ecosystem.\n\nI can help you with:\n• Blood, platelet, plasma & organ donation\n• Bone marrow & HLA compatibility\n• Human milk bank information\n• Donor eligibility & procedures\n\nHow can I assist you today? If this is a medical emergency, please call 108 immediately.",
            isEmergency: false
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const isUrgent = (text: string) => URGENCY_KEYWORDS.some(k => text.toLowerCase().includes(k));

    const sendMessage = async (text?: string) => {
        const userText = text || input.trim();
        if (!userText || loading) return;

        const urgent = isUrgent(userText);
        const processedText = urgent ? `High Urgency Context: The user may be in a medical emergency.\n\n${userText}` : userText;

        const newMessages: MessageProps["msg"][] = [...messages, { role: "user", content: userText, isEmergency: false }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        // Note: In a real app, this would be an API call to your backend
        // Since we don't have an Anthropic API key here, we simulate a response
        try {
            // Simulation delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            let reply = "";
            if (urgent) {
                reply = "I've detected a high urgency situation. Please understand that I am an AI, not a medical professional. If you or someone else is in a critical condition (ICU, heavy bleeding, unconscious), please STOP using this app and call 108 (Emergency Services) immediately.\n\nOnce safety is ensured, I can help you understand the next steps for donation matching.";
            } else {
                reply = "I'm LifeForge AI! I am currently in demonstration mode. In a full production environment, I would connect to the LifeForge intelligent engine to provide specific details about " + userText.split(' ').slice(0, 3).join(' ') + " and more.\n\nHow else can I guide you through our life-saving system?";
            }

            setMessages(prev => [...prev, {
                role: "assistant",
                content: reply,
                isEmergency: urgent
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "I'm having trouble connecting right now. If this is an emergency, please call 108 immediately.",
                isEmergency: urgent
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center font-body text-foreground pb-10">
            {/* Header Area */}
            <div className="w-full bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
                <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-muted rounded-full transition-colors mr-2">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                            <Heart size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-xl leading-none">LifeForge AI</h1>
                            <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold mt-1">
                                Donor Intelligence Companion
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">AI Assistant Online</span>
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="w-full max-w-4xl px-6 mt-6">
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 flex items-start gap-3 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    <span className="text-base shrink-0">🚨</span>
                    <p>
                        <strong className="text-primary font-bold">Medical Emergency?</strong> Call <span className="text-primary font-bold">108</span> immediately. This AI provides informational guidance only and is not a substitute for professional medical advice, diagnosis, or treatment.
                    </p>
                </div>
            </div>

            {/* Main Chat Container */}
            <div className="w-full max-w-4xl flex-1 flex flex-col gap-8 px-6 mt-8 overflow-hidden">

                {/* Quick Help Section - Only visible when we have few messages */}
                {messages.length < 3 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {QUICK_PROMPTS.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(p.text)}
                                className="bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/50 transition-all p-3 rounded-xl text-left flex flex-col gap-1 group"
                            >
                                <span className="text-base">{p.label.split(' ')[0]}</span>
                                <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors leading-tight">
                                    {p.label.split(' ').slice(1).join(' ')}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                    {messages.map((msg, i) => (
                        <Message key={i} msg={msg} />
                    ))}
                    {loading && (
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shrink-0">
                                <Heart size={18} fill="currentColor" />
                            </div>
                            <div className="bg-muted/30 border border-border rounded-2xl rounded-tl-none overflow-hidden shadow-sm">
                                <TypingIndicator />
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} className="h-4" />
                </div>

                {/* Input Area Overlaying Chat */}
                <div className="pt-4 pb-6 sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-10 px-1">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary-dark/20 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
                        <div className="relative flex items-end gap-3 bg-white dark:bg-muted/20 border-2 border-border focus-within:border-primary/50 rounded-2xl p-3 shadow-xl shadow-black/5 transition-all">
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder="Ask about donation eligibility, compatibility, procedures..."
                                rows={1}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-2.5 max-h-32 resize-none overflow-y-auto"
                                onInput={e => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = "auto";
                                    target.style.height = Math.min(target.scrollHeight, 128) + "px";
                                }}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all transform active:scale-95 ${input.trim() && !loading
                                        ? "bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/20"
                                        : "bg-muted text-muted-foreground cursor-not-allowed"
                                    }`}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className="ml-0.5" />}
                            </button>
                        </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center px-2">
                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                            <CheckCircle2 size={10} className="text-primary" /> India-wide donor intelligence
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                            Shift + Enter for new line
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
