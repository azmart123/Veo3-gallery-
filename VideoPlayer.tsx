/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {Video} from '../types';
import {PencilSquareIcon, XMarkIcon} from './icons';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
  onEdit: (video: Video) => void;
}

/**
 * A component that renders a video player with controls, description, and edit button.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  onClose,
  onEdit,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog">
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl relative overflow-hidden flex flex-col max-h-[90vh] m-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex-shrink-0 p-2 sm:p-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
            aria-label="Close video player">
            <XMarkIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden shadow-lg">
            <video
              key={video.id}
              className="w-full h-full"
              src={video.videoUrl}
              controls
              autoPlay
              loop
              aria-label={video.title}
            />
          </div>
        </div>
        <div className="flex-1 p-4 sm:p-6 pt-2 sm:pt-4 overflow-y-auto">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-2">
                {video.title}
              </h2>
              <p className="text-sm text-gray-300 mt-0 whitespace-pre-wrap">
                {video.description}
              </p>
            </div>
            <button
              onClick={() => onEdit(video)}
              className="flex-shrink-0 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 text-base"
              aria-label="Remix this video">
              <PencilSquareIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Remix</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
