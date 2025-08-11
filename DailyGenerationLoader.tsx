/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {SparklesIcon} from './icons';

interface DailyGenerationLoaderProps {
  status: string;
}

/**
 * A fullscreen overlay that displays the progress of daily video generation.
 */
export const DailyGenerationLoader: React.FC<DailyGenerationLoaderProps> = ({
  status,
}) => {
  return (
    <div
      className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 animate-fade-in"
      aria-live="polite"
      aria-busy="true">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-dashed rounded-full animate-spin border-purple-500/50"></div>
        <div className="w-full h-full flex items-center justify-center">
          <SparklesIcon className="w-12 h-12 text-purple-400 animate-pulse" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mt-8">
        Generating Today's Gallery
      </h2>
      <p className="text-gray-400 mt-2 text-center px-4 max-w-sm">{status}</p>
    </div>
  );
};
