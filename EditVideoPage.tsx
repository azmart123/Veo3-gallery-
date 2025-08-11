/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useState} from 'react';
import {Video} from '../types';

const NEW_VIDEO_ID = 'new-video';

interface EditVideoPageProps {
  video: Video;
  onSave: (updatedVideo: Video) => void;
  onCancel: () => void;
}

/**
 * A page that allows the user to edit the description of a video.
 * It provides input field for the description and buttons to save or cancel the changes.
 */
export const EditVideoPage: React.FC<EditVideoPageProps> = ({
  video,
  onSave,
  onCancel,
}) => {
  const [description, setDescription] = useState(video.description);
  const isNewVideo = video.id === NEW_VIDEO_ID;

  const handleSave = () => {
    onSave({...video, description});
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl shadow-purple-500/10">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            {isNewVideo ? 'Create Your Masterpiece' : 'Remix Video'}
          </h1>
          <p className="text-gray-400">
            {isNewVideo
              ? 'Describe the video you want to create.'
              : 'Modify the prompt to generate a new variation.'}
          </p>
        </header>

        <main>
          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-2">
              Video text prompt
            </label>
            <textarea
              id="description"
              rows={10}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-label={
                isNewVideo
                  ? 'Enter prompt for new video'
                  : `Edit description for the video`
              }
              placeholder="e.g., A cinematic, photorealistic shot of an astronaut riding a horse on Mars."
            />
          </div>
        </main>

        <footer className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!description.trim()}
            className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
            {isNewVideo ? 'Generate Video' : 'Generate new video'}
          </button>
        </footer>
      </div>
    </div>
  );
};
