import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

export default function InterviewRoom() {
  const { roomCode } = useParams()
  const navigate = useNavigate()

  const [roomInfo, setRoomInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mediaError, setMediaError] = useState('')

  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isCamMuted, setIsCamMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [hasRemoteStream, setHasRemoteStream] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const chatBottomRef = useRef(null)

  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenTrackRef = useRef(null)
  const lastSignalTimeRef = useRef(null)
  const iceQueueRef = useRef([])
  const showChatRef = useRef(showChat)

  useEffect(() => {
    showChatRef.current = showChat
    if (showChat) setUnreadChatCount(0)
  }, [showChat])

  // Cleanup WebRTC & media streams on exit
  const cleanup = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop()
      screenTrackRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
  }

  useEffect(() => {
    let isMounted = true
    let pollInterval = null
    let chatInterval = null

    const init = async () => {
      try {
        const infoRes = await api.get(`/interviews/room/${roomCode}`)
        if (!isMounted) return
        setRoomInfo(infoRes.data)
        const info = infoRes.data

        // 1. Get user media (mic & camera)
        let stream = null
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          if (!isMounted) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          localStreamRef.current = stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
          }
        } catch (mErr) {
          console.warn('Could not acquire camera/microphone:', mErr)
          setMediaError('Could not access your camera/microphone. Please allow browser permissions.')
        }

        // 2. Setup RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        })
        pcRef.current = pc

        if (stream) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream))
        }

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setHasRemoteStream(true)
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0]
            }
          }
        }

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            api
              .post(`/interviews/room/${roomCode}/signal`, {
                type: 'ICE',
                payload: JSON.stringify(event.candidate),
              })
              .catch(() => {})
          }
        }

        // Helper functions for negotiation
        const sendOffer = async () => {
          try {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            await api.post(`/interviews/room/${roomCode}/signal`, {
              type: 'OFFER',
              payload: JSON.stringify(offer),
            })
          } catch (e) {
            console.error('Failed to create/send offer:', e)
          }
        }

        const handleOffer = async (offerObj) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offerObj))
            while (iceQueueRef.current.length > 0) {
              await pc.addIceCandidate(iceQueueRef.current.shift()).catch(() => {})
            }
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            await api.post(`/interviews/room/${roomCode}/signal`, {
              type: 'ANSWER',
              payload: JSON.stringify(answer),
            })
          } catch (e) {
            console.error('Failed to handle offer:', e)
          }
        }

        const handleAnswer = async (answerObj) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answerObj))
            while (iceQueueRef.current.length > 0) {
              await pc.addIceCandidate(iceQueueRef.current.shift()).catch(() => {})
            }
          } catch (e) {
            console.error('Failed to handle answer:', e)
          }
        }

        // Notify presence in room
        api
          .post(`/interviews/room/${roomCode}/signal`, {
            type: 'JOIN',
            payload: JSON.stringify({ role: info.role }),
          })
          .catch(() => {})

        // Signal polling loop
        const pollSignals = async () => {
          try {
            const res = await api.get(`/interviews/room/${roomCode}/signals`, {
              params: lastSignalTimeRef.current ? { since: lastSignalTimeRef.current } : {},
            })
            const signals = res.data || []
            for (const sig of signals) {
              lastSignalTimeRef.current = sig.timestamp
              if (sig.type === 'JOIN') {
                if (info.role === 'INTERVIEWER') {
                  await sendOffer()
                } else {
                  api
                    .post(`/interviews/room/${roomCode}/signal`, {
                      type: 'JOIN_ACK',
                      payload: '{}',
                    })
                    .catch(() => {})
                }
              } else if (sig.type === 'JOIN_ACK') {
                if (info.role === 'INTERVIEWER') {
                  await sendOffer()
                }
              } else if (sig.type === 'OFFER') {
                await handleOffer(JSON.parse(sig.payload))
              } else if (sig.type === 'ANSWER') {
                await handleAnswer(JSON.parse(sig.payload))
              } else if (sig.type === 'ICE') {
                const candidate = new RTCIceCandidate(JSON.parse(sig.payload))
                if (pc.remoteDescription && pc.remoteDescription.type) {
                  await pc.addIceCandidate(candidate).catch(() => {})
                } else {
                  iceQueueRef.current.push(candidate)
                }
              }
            }
          } catch {
            // Transient polling catch
          }
        }

        // Chat polling loop
        const pollChat = async () => {
          try {
            const res = await api.get(`/interviews/room/${roomCode}/chat`)
            const msgs = res.data || []
            setChatMessages((prev) => {
              if (msgs.length > prev.length && !showChatRef.current && prev.length > 0) {
                setUnreadChatCount((c) => c + (msgs.length - prev.length))
              }
              return msgs
            })
          } catch {}
        }

        // Run immediately and set intervals
        pollSignals()
        pollChat()
        pollInterval = setInterval(pollSignals, 1500)
        chatInterval = setInterval(pollChat, 2000)

        setLoading(false)
      } catch (err) {
        if (!isMounted) return
        setError(err.response?.data?.message || 'Could not connect to video interview room.')
        setLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
      if (pollInterval) clearInterval(pollInterval)
      if (chatInterval) clearInterval(chatInterval)
      cleanup()
    }
  }, [roomCode])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, showChat])

  const toggleMic = () => {
    if (localStreamRef.current) {
      const next = !isMicMuted
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next))
      setIsMicMuted(next)
    }
  }

  const toggleCam = () => {
    if (localStreamRef.current) {
      const next = !isCamMuted
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !next))
      setIsCamMuted(next)
    }
  }

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = stream.getVideoTracks()[0]
        screenTrackRef.current = screenTrack

        const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video')
        if (sender) {
          sender.replaceTrack(screenTrack)
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        screenTrack.onended = () => {
          stopScreenShare()
        }
        setIsScreenSharing(true)
      } catch (err) {
        console.warn('Screen share canceled or denied', err)
      }
    } else {
      stopScreenShare()
    }
  }

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop()
      screenTrackRef.current = null
    }
    const camTrack = localStreamRef.current?.getVideoTracks()[0]
    const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video')
    if (sender && camTrack) {
      sender.replaceTrack(camTrack)
    }
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
    setIsScreenSharing(false)
  }

  const handleSendChat = async (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const text = chatInput.trim()
    setChatInput('')
    try {
      await api.post(`/interviews/room/${roomCode}/chat`, { text })
      const res = await api.get(`/interviews/room/${roomCode}/chat`)
      setChatMessages(res.data || [])
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const leaveRoom = () => {
    cleanup()
    if (roomInfo?.role === 'INTERVIEWER') {
      navigate(-1)
    } else {
      navigate('/student/interviews')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-slate-600">Connecting to secure video room...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-lg rounded-xl bg-white p-8 text-center shadow-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          ⚠️
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-800">Cannot Join Room</h2>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Go Back
        </button>
      </div>
    )
  }

  const peerName = roomInfo?.role === 'INTERVIEWER' ? roomInfo?.studentName : roomInfo?.companyName

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col bg-slate-950 text-white rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-3 backdrop-blur">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-slate-100">{roomInfo?.internshipTitle}</h1>
            <span className="rounded-full bg-indigo-900/60 px-2.5 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-700/50">
              {roomInfo?.role === 'INTERVIEWER' ? 'Recruiter / Interviewer' : 'Candidate'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Interviewer: {roomInfo?.companyName} · Candidate: {roomInfo?.studentName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Encrypted WebRTC
          </span>
          <button
            onClick={leaveRoom}
            className="rounded-lg bg-red-600/90 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
          >
            Leave Call
          </button>
        </div>
      </div>

      {mediaError && (
        <div className="bg-amber-900/40 border-b border-amber-700/50 px-6 py-2 text-xs text-amber-200 text-center">
          ⚠️ {mediaError}
        </div>
      )}

      {/* Main Video & Chat Stage */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Videos Area */}
        <div className="flex flex-1 flex-col p-4">
          <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Local Video */}
            <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-inner">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover -scale-x-100 ${isCamMuted ? 'hidden' : ''}`}
              />
              {isCamMuted && (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-2xl font-bold text-slate-200">
                    You
                  </div>
                  <p className="mt-3 text-xs text-slate-400">Camera is turned off</p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/60 px-2.5 py-1 text-xs backdrop-blur">
                <span>You ({roomInfo?.role === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'})</span>
                {isMicMuted && <span className="text-red-400">🔇 Muted</span>}
                {isScreenSharing && <span className="text-emerald-400">🖥️ Sharing</span>}
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-inner">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`h-full w-full object-cover ${!hasRemoteStream ? 'hidden' : ''}`}
              />
              {!hasRemoteStream && (
                <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="h-16 w-16 animate-pulse rounded-full bg-slate-800 flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-300">Waiting for {peerName} to connect...</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Video and audio will stream automatically once both participants are present.
                  </p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs backdrop-blur">
                {peerName || 'Participant'}
              </div>
            </div>
          </div>

          {/* Bottom Control Dock */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={toggleMic}
              title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-lg shadow transition-all ${
                isMicMuted ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              {isMicMuted ? '🔇' : '🎙️'}
            </button>

            <button
              onClick={toggleCam}
              title={isCamMuted ? 'Turn on camera' : 'Turn off camera'}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-lg shadow transition-all ${
                isCamMuted ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              {isCamMuted ? '🚫' : '📹'}
            </button>

            <button
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-lg shadow transition-all ${
                isScreenSharing ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              🖥️
            </button>

            <button
              onClick={() => setShowChat((v) => !v)}
              title="Toggle in-room chat"
              className={`relative flex h-12 w-12 items-center justify-center rounded-full text-lg shadow transition-all ${
                showChat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              💬
              {unreadChatCount > 0 && !showChat && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadChatCount}
                </span>
              )}
            </button>

            <button
              onClick={leaveRoom}
              title="Leave call"
              className="flex h-12 px-6 items-center justify-center rounded-full bg-red-600 font-semibold text-white shadow hover:bg-red-500 transition-all text-sm gap-2"
            >
              <span>📞</span> Leave
            </button>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 flex flex-col border-l border-slate-800 bg-slate-900/95 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <h3 className="font-semibold text-sm text-slate-200">Interview Room Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
              {chatMessages.length === 0 && (
                <p className="mt-8 text-center text-slate-500">No messages yet. Send a message to get started.</p>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="rounded-lg bg-slate-800/80 p-2.5">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-indigo-400">{msg.sender}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="mt-1 text-slate-200 whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendChat} className="border-t border-slate-800 p-3 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
