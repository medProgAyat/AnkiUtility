import React from 'react'

export const PlusIcon = ({ w=16, h=16 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:'inline-block', verticalAlign:'middle'}}>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const PencilIcon = ({ w=16, h=16 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:'inline-block', verticalAlign:'middle'}}>
    <path d="M3 21l3-1 11-11 1-3-3 1L4 20z" fill="currentColor" />
    <path d="M14 7l3 3" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
  </svg>
)

export const SaveIcon = ({ w=16, h=16 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:'inline-block', verticalAlign:'middle'}}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 21v-8H7v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const TrashIcon = ({ w=16, h=16 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:'inline-block', verticalAlign:'middle'}}>
    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const XIcon = ({ w=14, h=14 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:'inline-block', verticalAlign:'middle'}}>
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CsvIcon = ({ w=16, h=16 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:'inline-block', verticalAlign:'middle'}}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 9.5h5M3.5 12.5h5M3.5 15.5h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
  </svg>
)
