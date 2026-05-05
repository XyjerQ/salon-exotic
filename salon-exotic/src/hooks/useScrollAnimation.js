import { useEffect, useRef } from 'react'

export const useScrollAnimation = (options = {}) => {
  const ref = useRef(null)
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    delay = 0,
    staggerChildren = false,
  } = options

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            if (staggerChildren) {
              const children = entry.target.querySelectorAll('.opacity-0-init')
              children.forEach((child, i) => {
                setTimeout(() => {
                  child.classList.add('animate-fade-up')
                }, i * 100)
              })
              entry.target.classList.add('animate-fade-up')
            } else {
              entry.target.classList.add('animate-fade-up')
            }
            observer.unobserve(entry.target)
          }, delay)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold, rootMargin, delay, staggerChildren])

  return ref
}

