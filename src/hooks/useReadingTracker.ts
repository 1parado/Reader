"use client";

import { useState, useEffect, useRef } from 'react';

export interface SectionStat {
  id: string;
  timeSpent: number; // in seconds
  viewCount: number;
  isStuck: boolean;
  wordCount: number;
  threshold: number;
}

interface SectionData {
  id: string;
  content: string;
}

const WPM = 200;
const THRESHOLD_MULTIPLIER = 1.5;

export const useReadingTracker = (sections: SectionData[]) => {
  const [stats, setStats] = useState<Record<string, SectionStat>>({});
  const [activeSectionIds, setActiveSectionIds] = useState<Set<string>>(new Set());
  
  // Initialize stats
  useEffect(() => {
    const initialStats: Record<string, SectionStat> = {};
    activeIdsRef.current.clear();
    activeIntersections.current.clear();
    
    sections.forEach(section => {
      const wordCount = section.content.split(/\s+/).length;
      // Threshold in seconds: (words / 200) * 60 * 1.5
      const threshold = (wordCount / WPM) * 60 * THRESHOLD_MULTIPLIER;
      
      initialStats[section.id] = {
        id: section.id,
        timeSpent: 0,
        viewCount: 0,
        isStuck: false,
        wordCount,
        threshold
      };
    });
    setStats(initialStats);
  }, [sections]);

  const activeIntersections = useRef<Map<string, number>>(new Map());
  const activeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeIntersections.current.set(entry.target.id, entry.intersectionRatio);
            
            // Increment view count only once when entering
            if (!activeIdsRef.current.has(entry.target.id)) {
                activeIdsRef.current.add(entry.target.id);
                
                setStats((prev) => {
                    const current = prev[entry.target.id];
                    if (!current) return prev;
                    return {
                        ...prev,
                        [entry.target.id]: {
                            ...current,
                            viewCount: current.viewCount + 1
                        }
                    };
                });

                setActiveSectionIds(new Set(activeIdsRef.current));
            }
          } else {
            activeIntersections.current.delete(entry.target.id);
            if (activeIdsRef.current.has(entry.target.id)) {
                activeIdsRef.current.delete(entry.target.id);
                setActiveSectionIds(new Set(activeIdsRef.current));
            }
          }
        });
      },
      {
        threshold: [0.1, 0.3, 0.5, 0.7, 0.9], // Multiple thresholds for better accuracy
      }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  // Timer for active sections
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeSectionIds.size === 0) return;

      // Find the "primary" section (the one with highest intersection ratio or top-most)
      let primaryId: string | null = null;
      let maxRatio = 0;
      
      activeSectionIds.forEach(id => {
         const ratio = activeIntersections.current.get(id) || 0;
         if (ratio > maxRatio) {
             maxRatio = ratio;
             primaryId = id;
         }
      });

      if (!primaryId) return;

      setStats((prev) => {
        const nextStats = { ...prev };
        let hasChanges = false;
        
        // Only update the primary section
        const id = primaryId!;
        if (nextStats[id]) {
            const current = nextStats[id];
            // Only count if not stuck yet
            if (!current.isStuck) {
              const newTime = current.timeSpent + 1;
              const isStuck = newTime > current.threshold;

              nextStats[id] = {
                ...current,
                timeSpent: newTime,
                isStuck
              };
              hasChanges = true;
            }
        }

        return hasChanges ? nextStats : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSectionIds]);

  return { stats, activeSectionIds };
};
