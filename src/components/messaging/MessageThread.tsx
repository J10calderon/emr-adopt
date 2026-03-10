"use client"

import { useState, useEffect, useRef } from "react"

type Message =  {
    id: string
    content: string
    createdAt: string
    senderId: string
    sender: { id: string; name: string | null }
}

type Props = {
    adoptionId: string
    currentUserId: string
    compact?: boolean
}

export default function MessageThread({ adoptionId, currentUserId, compact = false }: Props) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [sending, setSending] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    async function fetchMessages() {
        const res = await fetch(`/api/adoptions/${adoptionId}/messages`)
        if (res.ok) {
            const data = await res.json()
            setMessages(data)
        }
    }

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 15000)
        return () => clearInterval(interval)
    }, [adoptionId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    async function handleSend() {
        if (!newMessage.trim()) return
        setSending(true)
        const res = await fetch(`/api/adoptions/${adoptionId}/messages`,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: newMessage }),
        })
        setSending(false)
        if (res.ok) {
            setNewMessage("")
            fetchMessages()
        }
    }

    if (compact) {
        const latest = messages[messages.length - 1]
        return (
            <div className="text-sm text-muted-foreground">
                {latest ? (
                    <p className="truncate">"{latest.content}"</p>
                ) : (
                    <p>No messages yet.</p>
                )}
                <a href={`/donor/adoptions/${adoptionId}`} className="text-primary hover:underline mt-1 inline-block">
                    View conversation ({messages.length})
                </a>
            </div>
        )
    }

    return (
        <div className="border rounded-lg flex flex-col">
            <div className="h-64 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center mt-8">No messages yet. Start the conversation!</p>
                )}
                {messages.map((msg) => {
                    const isMine = msg.senderId === currentUserId
                    return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                isMine
                                    ? "bg-emerald-500 text-white"
                                    : "bg-white border text-gray-800" 
                            }`}>
                                {!isMine && (
                                    <p className="text-xs font-medium mb-1 text-gray-500">{msg.sender.name}</p>
                                )}
                                <p>{msg.content}</p>
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>
            <div className="border-t p-3 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 disabled:opacity-50"
                >
                    {sending ? "..." : "Send"}
                </button>
            </div>
        </div>
    )
}
