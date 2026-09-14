import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const messageStatusLabels = { new: 'New', in_progress: 'In progress', resolved: 'Resolved' }

export default function MessagesManager({ token }) {
  const [messages, setMessages] = useState([])
  const [replies, setReplies] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sendingId, setSendingId] = useState(null)
  const [selectedMessage, setSelectedMessage] = useState(null)

  // Bezpieczne pobieranie tokena (z propsa lub localStorage jako fallback)
  const activeToken = token || localStorage.getItem('employeeToken')

  const loadMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load messages')
      setMessages(data)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [activeToken])

  const sendReply = async (messageId) => {
    const reply = (replies[messageId] || '').trim()
    if (reply.length < 2) return

    setSendingId(messageId)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({ reply })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send reply')
      setReplies((current) => ({ ...current, [messageId]: '' }))
      await loadMessages()
      setSelectedMessage((current) => current ? { ...current, reply } : current)
    } catch (sendError) {
      setError(sendError.message)
    } finally {
      setSendingId(null)
    }
  }

  const updateStatus = async (messageId, status) => {
    setError('')
    try {
      const response = await fetch(`${API_BASE}/messages/${messageId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({ status })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to update message status')
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, status } : message))
      setSelectedMessage((current) => current ? { ...current, status } : current)
    } catch (statusError) {
      setError(statusError.message)
    }
  }

  if (loading) return <p className="text-gray-600">Loading messages...</p>

  return (
    <section className="bg-white rounded-xl shadow-md p-6">
      {selectedMessage ? (
        <div>
          <button
            onClick={() => setSelectedMessage(null)}
            className="mb-6 text-sm font-semibold text-gray-600 hover:text-black"
          >
            &larr; Back to messages
          </button>

          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-6 mb-6">
            <div>
              <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">Message details</p>
              <h2 className="text-3xl font-bold">{selectedMessage.subject}</h2>
              <p className="text-gray-600 mt-2">
                Received {new Date(selectedMessage.created_at).toLocaleString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              selectedMessage.status === 'resolved' ? 'bg-green-100 text-green-800' : selectedMessage.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {messageStatusLabels[selectedMessage.status] || 'New'}
            </span>
          </div>

          {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-8">
            <div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 min-h-[220px]">
                <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">{selectedMessage.message}</p>
              </div>

              {(selectedMessage.vehicle_name || selectedMessage.vehicle_vin) && (
                <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">Vehicle</p>
                  <p className="font-semibold text-gray-900">{selectedMessage.vehicle_name || 'Vehicle inquiry'}</p>
                  {selectedMessage.vehicle_vin && <p className="mt-1 font-mono text-sm text-gray-700">VIN: {selectedMessage.vehicle_vin}</p>}
                </div>
              )}

              {selectedMessage.reply && (
                <div className="border-l-4 border-green-500 bg-green-50 p-5 mt-6">
                  <p className="text-xs font-bold uppercase text-green-800 mb-2">Reply sent</p>
                  <p className="whitespace-pre-wrap text-gray-800">{selectedMessage.reply}</p>
                </div>
              )}

              <div className="mt-8">
                <h3 className="text-xl font-bold mb-3">Reply to customer</h3>
                <textarea
                  rows="6"
                  value={replies[selectedMessage.id] || ''}
                  onChange={(event) => setReplies((current) => ({ ...current, [selectedMessage.id]: event.target.value }))}
                  placeholder="Write a reply..."
                  className="w-full border border-gray-300 rounded-md px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={() => sendReply(selectedMessage.id)}
                  disabled={sendingId === selectedMessage.id || !(replies[selectedMessage.id] || '').trim()}
                  className="mt-3 bg-black text-white px-6 py-3 rounded-md font-semibold disabled:opacity-50"
                >
                  {sendingId === selectedMessage.id ? 'Sending...' : 'Reply by email'}
                </button>
              </div>
            </div>

            <aside className="h-fit border border-gray-200 rounded-lg p-5">
              <h3 className="font-bold mb-4">Customer</h3>
              <p className="font-semibold text-lg">{selectedMessage.name}</p>
              <a className="block text-sm text-gray-600 underline mt-2 break-all" href={`mailto:${selectedMessage.email}`}>
                {selectedMessage.email}
              </a>
              {selectedMessage.phone && <p className="text-sm text-gray-600 mt-2">{selectedMessage.phone}</p>}
              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">Message status</span>
                <select
                  value={selectedMessage.status || 'new'}
                  onChange={(event) => updateStatus(selectedMessage.id, event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  {Object.entries(messageStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </aside>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Messages</h2>
              <p className="text-gray-500 text-sm">Open a message to read it and reply by email.</p>
            </div>
            <button
              onClick={loadMessages}
              className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Refresh
            </button>
          </div>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600 text-sm">
                    <th className="py-3 px-3 w-[19%]">Customer</th>
                    <th className="py-3 px-3 w-[25%]">Subject</th>
                    <th className="py-3 px-3 w-[32%]">Preview</th>
                    <th className="py-3 px-3 w-[14%]">Date</th>
                    <th className="py-3 px-3 w-[10%]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {messages.map((message) => (
                    <tr
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-3 truncate">
                        <span className="font-semibold block truncate">{message.name}</span>
                        <span className="text-gray-500 block truncate">{message.email}</span>
                      </td>
                      <td className="py-4 px-3 font-medium truncate">{message.subject}</td>
                      <td className="py-4 px-3 text-gray-600 truncate">{message.message}</td>
                      <td className="py-4 px-3 text-gray-600 whitespace-nowrap">{new Date(message.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          message.status === 'resolved' ? 'bg-green-100 text-green-800' : message.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {messageStatusLabels[message.status] || 'New'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}