/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {SparklesIcon} from './icons';

/**
 * A fullscreen overlay that displays a loading animation and text indicating that
 * a video remix is being created.
 */
export const SavingProgressPage: React.FC = () => {
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
        Creating your vision...
      </h2>
      <p className="text-gray-400 mt-2">
        Please wait while we bring your prompt to life.
      </p>
    </div>
  );
};
