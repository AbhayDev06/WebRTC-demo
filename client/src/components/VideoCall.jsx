import { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../context/SocketContext";
import { useParams } from "react-router-dom";
import { Mic, MicOff, Phone, Video, VideoOff } from "lucide-react";

const VideoCall = () => {
  const { socket } = useSocketContext();
  const { userId } = useParams();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callTo, setCallTo] = useState("");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const iceCandidateQueue = useRef([]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [callType, setCallType] = useState("video");

  useEffect(() => {
    if (!socket) return;
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("joinRoom", userId);

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [socket, userId]);

  const setupWebRTC = async () => {
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("first: ", userId === "baccha" ? "jaana" : "baccha");
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: userId === "baccha" ? "jaana" : "baccha",
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      console.log("ontrack event:", event);
      const stream = event.streams[0];
      if (!stream) {
        console.error("No stream received in ontrack event");
        return;
      }
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        console.log("Assigning remote stream to video element");
        remoteVideoRef.current.srcObject = stream;
      } else {
        console.error("remoteVideoRef is not available");
      }
    };

    try {
      const constraints = {
        video: callType === "video",
        audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const handleOffer = async ({ offer, from }) => {
    console.log("Received offer from:", from);
    if (!peerConnectionRef.current) await setupWebRTC();
    try {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      console.log("Remote description set for offer");
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit("answer", { answer, to: from });
      // Process queued ICE candidates
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift();
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        console.log("Processed queued ICE candidate");
      }
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  const handleAnswer = async ({ answer }) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      console.log("Remote description set for answer");
      // Process queued ICE candidates
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift();
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        console.log("Processed queued ICE candidate");
      }
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  };

  const handleIceCandidate = async ({ candidate }) => {
    try {
      if (!peerConnectionRef.current) {
        console.warn("Peer connection not initialized, queuing ICE candidate");
        iceCandidateQueue.current.push(candidate);
        return;
      }
      if (!peerConnectionRef.current.remoteDescription) {
        console.warn("Remote description not set, queuing ICE candidate");
        iceCandidateQueue.current.push(candidate);
        return;
      }
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
      console.log("Added ICE candidate");
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  };

  const startCall = async (to) => {
    setCallTo(to);
    try {
      await setupWebRTC();
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log("Sending offer to:", to);
      socket.emit("offer", { offer, to, from: userId });
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const toggleVideo = (type) => {
    setCallType(type);
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log("Video toggled:", videoTrack.enabled ? "on" : "off");
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
        console.log("Mic toggled:", audioTrack.enabled ? "unmuted" : "muted");
      }
    }
  };

  return (
    <>
      <div className="relative w-full h-[85vh] bg-black flex items-center justify-center">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute top-0 left-0 w-full h-full rounded-lg"
        />
        <div className="absolute bottom-[10px] md:bottom-0 right-1 bg-gray-900 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            className="w-28 h-36 md:w-56 md:h-52 object-cover rounded-lg"
          />
        </div>
      </div>

      <div className="flex justify-around items-center card mt-2 px-4">
        <button
          className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg"
          onClick={()=> toggleVideo(callType === "audio" ? "video" : "audio")}
        >
          {callType === "audio" ? <Video color="#fff" /> : <Phone color="#fff" />}
          {/* <Video color="#fff" /> */}
        </button>
        <button
          className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg"
          onClick={toggleMic}
        >
          {isMicMuted ? <MicOff color="#fff" /> : <Mic color="#fff" />}
        </button>
        <button
          onClick={() => startCall(userId === "baccha" ? "jaana" : "baccha")}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-slate-50 p-3 rounded-lg"
        >
          Call {userId === "baccha" ? "Jaana" : "Baccha"}
        </button>
      </div>
    </>
  );
};

export default VideoCall;
