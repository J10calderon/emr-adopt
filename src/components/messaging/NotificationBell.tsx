"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

type Notification = {
    id: string
    type: string
    title: string
    body: string
    isRead: boolean
    link: string | null
    createdAt: string
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [open, setOpen] = useState(false)

    async function fetchNotifications() {
        const res = await fetch("/api/notifications")
        if (res.ok) {
            const data = await res.json()
            setNotifications(data)
        }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    async function handleOpen() {
        const next = !open //if open is false, next == true. If open is true, next = false
        setOpen(next)
        if (next) {
            await fetch("/api/notifications/read-all", { method: "PATCH"})
            setNotifications(prev => prev.map(n => ({...n, isRead: true })))
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <div className="relative">
            <button onClick={handleOpen} className="relative p-2 text-gray-600 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="p-3 border-b border-gray-100">
                        <p className="font-semibold text-sm text-gray-900">Notifications</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-sm text-gray-500 p-4 text-center">No notifications yet</p>
                        ) : (
                            notifications.slice(0, 20).map(n => (
                                <div key={n.id} className={`p-3 border-b border-gray-50 last:border-0 ${!n.isRead ? "bg-emerald-50" : ""}`}>
                                    {n.link ? (
                                        <Link href={n.link} onClick={() => setOpen(false)} className="block">
                                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                                            <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                                        </Link>
                                    ) : (
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                                            <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}