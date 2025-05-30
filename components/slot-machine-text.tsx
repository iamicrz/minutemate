"use client"

import React, { useEffect, useRef, useState } from "react"

const WORDS = [
  "Professionals",
  "Designers",
  "Lawyers",
  "Engineers",
  "Accountants",
  "Carpenters",
  "Full-Stack Developers",
  "Plumbers",
  "Business Analysts",
  "Electricians",
  "Data Scientists",
  "Portfolio Managers"
]

interface SlotMachineTextProps {
  className?: string
}

export default function SlotMachineText({ className }: SlotMachineTextProps) {
  const [index, setIndex] = useState(0)
  const [animating, setAnimating] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setAnimating(true)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % WORDS.length)
        setAnimating(false)
      }, 350) // Animation duration (faster)
    }, 900) // Faster interval
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [index])

  // Find the longest word for minWidth
  const longest = WORDS.reduce((a, b) => (a.length > b.length ? a : b), "")
  // Use a little extra space for padding
  const minWidth = `${longest.length + 2}ch`

  return (
    <span
      className={`relative inline-block h-[1.2em] overflow-hidden align-bottom transition-colors duration-300 ${className}`}
      style={{ minWidth, whiteSpace: 'nowrap' }}
    >
      <span
        className={`block transition-transform duration-500 ease-in-out will-change-transform ${
          animating ? "translate-y-[100%] opacity-0" : "translate-y-0 opacity-100"
        }`}
        style={{ position: "absolute", left: 0, width: "100%", whiteSpace: 'nowrap' }}
        key={index}
      >
        {WORDS[index]}
      </span>
      <span
        className={`block transition-transform duration-500 ease-in-out will-change-transform ${
          animating ? "translate-y-0 opacity-100" : "translate-y-[-100%] opacity-0"
        }`}
        style={{ position: "absolute", left: 0, width: "100%", whiteSpace: 'nowrap' }}
        key={index + 1}
      >
        {WORDS[(index + 1) % WORDS.length]}
      </span>
    </span>
  )
}
