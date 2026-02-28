'use client'

import React from 'react'
import { X } from 'lucide-react'

interface YouTubeModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  exerciseName: string
}

export default function YouTubeModal({ isOpen, onClose, videoUrl, exerciseName }: YouTubeModalProps) {
  if (!isOpen) return null

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const videoId = getYouTubeVideoId(videoUrl)

  if (!videoId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Exercise Video</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Invalid YouTube URL provided</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex bg-transparent backdrop-blur-sm items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{exerciseName} - Exercise Video</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={`${exerciseName} Exercise Video`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}
