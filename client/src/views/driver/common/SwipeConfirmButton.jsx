import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import './SwipeConfirmButton.css';

// ==============================================================================
// REACT COMPONENT: SwipeConfirmButton
// iOS/Field-ops style swipe-to-confirm interactive slider button.
// Vanilla JS equivalent:
//   An element that tracks mousedown/mousemove/mouseup and
//   touchstart/touchmove/touchend, calculating translateX until it reaches
//   the end of the track (e.g. >= 80% width) then fires onConfirm().
// ==============================================================================
export function SwipeConfirmButton(props) {
  const onConfirm = props.onConfirm;
  const disabled = props.disabled;
  const label = props.label;

  let displayLabel = 'Swipe confirm pickup';
  if (label && label.length > 0) {
    displayLabel = label;
  }

  // State: current slider thumb pixel position
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const trackRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  // Maximum draggable width inside track
  function getMaxDrag() {
    if (!trackRef.current) {
      return 240;
    }
    const trackWidth = trackRef.current.clientWidth;
    // Thumb is 48px wide + 4px margin = 52px
    return Math.max(0, trackWidth - 54);
  }

  // Touch Handlers
  function handleTouchStart(e) {
    if (disabled || isCompleted) {
      return;
    }
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX - dragX;
  }

  function handleTouchMove(e) {
    if (!isDragging || disabled || isCompleted) {
      return;
    }
    const currentTouchX = e.touches[0].clientX;
    const maxDrag = getMaxDrag();
    let newX = currentTouchX - startXRef.current;

    if (newX < 0) {
      newX = 0;
    }
    if (newX > maxDrag) {
      newX = maxDrag;
    }

    currentXRef.current = newX;
    setDragX(newX);

    // If swiped >= 85% of track, trigger confirmation
    if (newX >= maxDrag * 0.88) {
      setIsCompleted(true);
      setIsDragging(false);
      setDragX(maxDrag);
      if (onConfirm) {
        onConfirm();
      }
    }
  }

  function handleTouchEnd() {
    if (disabled || isCompleted) {
      return;
    }
    setIsDragging(false);
    const maxDrag = getMaxDrag();
    if (currentXRef.current < maxDrag * 0.88) {
      // Snap back if threshold was not reached
      setDragX(0);
      currentXRef.current = 0;
    }
  }

  // Mouse Handlers (Desktop / Mouse dragging)
  function handleMouseDown(e) {
    if (disabled || isCompleted) {
      return;
    }
    setIsDragging(true);
    startXRef.current = e.clientX - dragX;
  }

  useEffect(function () {
    function onMouseMove(e) {
      if (!isDragging || disabled || isCompleted) {
        return;
      }
      const maxDrag = getMaxDrag();
      let newX = e.clientX - startXRef.current;

      if (newX < 0) {
        newX = 0;
      }
      if (newX > maxDrag) {
        newX = maxDrag;
      }

      currentXRef.current = newX;
      setDragX(newX);

      if (newX >= maxDrag * 0.88) {
        setIsCompleted(true);
        setIsDragging(false);
        setDragX(maxDrag);
        if (onConfirm) {
          onConfirm();
        }
      }
    }

    function onMouseUp() {
      if (!isDragging) {
        return;
      }
      setIsDragging(false);
      const maxDrag = getMaxDrag();
      if (currentXRef.current < maxDrag * 0.88) {
        setDragX(0);
        currentXRef.current = 0;
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return function cleanup() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, disabled, isCompleted, onConfirm]);

  // Accessibility click fallback: tap to complete
  function handleDirectTapConfirm() {
    if (disabled || isCompleted) {
      return;
    }
    const maxDrag = getMaxDrag();
    setDragX(maxDrag);
    setIsCompleted(true);
    if (onConfirm) {
      onConfirm();
    }
  }

  function getTrackClass() {
    if (disabled) {
      return 'swipe-track track-disabled';
    }
    if (isCompleted) {
      return 'swipe-track track-completed';
    }
    if (isDragging) {
      return 'swipe-track track-dragging';
    }
    return 'swipe-track';
  }

  function getThumbClass() {
    if (isCompleted) {
      return 'swipe-thumb thumb-completed';
    }
    if (isDragging) {
      return 'swipe-thumb thumb-active';
    }
    return 'swipe-thumb';
  }

  return (
    <div className="swipe-container">
      <div 
        ref={trackRef}
        className={getTrackClass()}
      >
        {/* Dynamic fill bar following the thumb */}
        <div 
          className="swipe-fill"
          style={{ width: (dragX + 26) + 'px' }}
        />

        {/* Track Label */}
        <div className="swipe-label-wrap">
          {!isCompleted && (
            <span className="swipe-label-text">
              {displayLabel}
              <ChevronRight size={16} className="swipe-shimmer-arrow" />
            </span>
          )}
          {isCompleted && (
            <span className="swipe-label-text label-confirmed">
              Pickup Confirmed!
            </span>
          )}
        </div>

        {/* Draggable Slider Thumb */}
        <div
          className={getThumbClass()}
          style={{ transform: 'translateX(' + dragX + 'px)' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          role="slider"
          aria-label={displayLabel}
          tabIndex={0}
        >
          {!isCompleted && <ArrowRight size={20} />}
          {isCompleted && <Check size={20} />}
        </div>
      </div>

      {/* Accessible desktop click button option */}
      <button 
        type="button" 
        onClick={handleDirectTapConfirm}
        className="swipe-tap-fallback"
        disabled={disabled || isCompleted}
      >
        Tap here if cannot swipe
      </button>
    </div>
  );
}
