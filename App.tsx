/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useEffect, useState} from 'react';
import {DailyGenerationLoader} from './components/DailyGenerationLoader';
import {EditVideoPage} from './components/EditVideoPage';
import {ErrorModal} from './components/ErrorModal';
import {PlusIcon, VideoCameraIcon} from './components/icons';
import {SavingProgressPage} from './components/SavingProgressPage';
import {VideoGrid} from './components/VideoGrid';
import {VideoPlayer} from './components/VideoPlayer';
import {LOCAL_STORAGE_KEYS, MOCK_VIDEOS} from './constants';
import {Video} from './types';

import {GeneratedVideo, GoogleGenAI, Type} from '@google/genai';

const VEO_MODEL_NAME = 'veo-3.0-generate-preview';
const TITLE_GENERATION_MODEL_NAME = 'gemini-2.5-flash';
const NEW_VIDEO_ID = 'new-video';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// ---

function bloblToBase64(blob: Blob) {
  return new Promise<string>(async (resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      resolve(url.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}

// ---

async function generateVideoFromText(
  prompt: string,
  numberOfVideos = 1,
): Promise<string[]> {
  let operation = await ai.models.generateVideos({
    model: VEO_MODEL_NAME,
    prompt,
    config: {
      numberOfVideos,
      aspectRatio: '16:9',
    },
  });

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    operation = await ai.operations.getVideosOperation({operation});
  }

  if (operation?.response) {
    const videos = operation.response?.generatedVideos;
    if (videos === undefined || videos.length === 0) {
      throw new Error('No videos generated');
    }

    return await Promise.all(
      videos.map(async (generatedVideo: GeneratedVideo) => {
        const url = decodeURIComponent(generatedVideo.video.uri);
        const res = await fetch(`${url}&key=${process.env.API_KEY}`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch video: ${res.status} ${res.statusText}`,
          );
        }
        const blob = await res.blob();
        return bloblToBase64(blob);
      }),
    );
  } else {
    throw new Error('No videos generated');
  }
}

/**
 * Main component for the Veo Gallery app.
 * It manages the state of videos, playing videos, editing videos and error handling.
 */
export const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [generationError, setGenerationError] = useState<string[] | null>(null);
  const [dailyGenerationStatus, setDailyGenerationStatus] = useState<
    string | null
  >(null);

  useEffect(() => {
    // Helper function to check if the stored date is from a previous day.
    const isNewDay = (storedDateStr: string | null): boolean => {
      if (!storedDateStr) return true;
      const today = new Date().toLocaleDateString();
      const storedDate = new Date(storedDateStr).toLocaleDateString();
      return today !== storedDate;
    };

    // Main logic for generating daily content.
    const generateDailyVideos = async () => {
      try {
        setDailyGenerationStatus('Dreaming up new video ideas...');
        const promptGenResponse = await ai.models.generateContent({
          model: TITLE_GENERATION_MODEL_NAME,
          contents:
            'Generate 3 diverse, creative, and visually interesting prompts for short, 5-10 second videos. The prompts should be suitable for a text-to-video AI model. Return the response as a JSON object with a single key "prompts" that holds an array of 3 strings.',
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                prompts: {
                  type: Type.ARRAY,
                  description: 'An array of 3 video prompt strings.',
                  items: {
                    type: Type.STRING,
                  },
                },
              },
            },
          },
        });

        const {prompts} = JSON.parse(promptGenResponse.text);
        if (!prompts || prompts.length === 0) {
          throw new Error('Failed to generate prompts.');
        }

        const newVideos: Video[] = [];
        for (let i = 0; i < prompts.length; i++) {
          const prompt = prompts[i];
          setDailyGenerationStatus(
            `Generating video ${i + 1} of ${
              prompts.length
            }: "${prompt.substring(0, 50)}..."`,
          );

          const videoObjects = await generateVideoFromText(prompt);
          if (!videoObjects || videoObjects.length === 0) continue;

          setDailyGenerationStatus(`Generating a title for video ${i + 1}...`);
          const titleResponse = await ai.models.generateContent({
            model: TITLE_GENERATION_MODEL_NAME,
            contents: `Generate a short, captivating title (5-7 words) for a video based on this prompt: "${prompt}". Do not include quotes in your response.`,
          });
          const title = titleResponse.text.trim();
          const videoUrl = `data:video/mp4;base64,${videoObjects[0]}`;

          newVideos.push({
            id: self.crypto.randomUUID(),
            title,
            description: prompt,
            videoUrl,
          });
        }
        return newVideos;
      } catch (error) {
        console.error('Daily generation failed:', error);
        setGenerationError([
          'Failed to generate daily videos.',
          'Please check your API key and try again later.',
        ]);
        return [];
      }
    };

    // Function to initialize the app state from localStorage or mocks.
    const initializeApp = async () => {
      const storedVideosRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.VIDEOS);
      const lastGenDate = localStorage.getItem(
        LOCAL_STORAGE_KEYS.LAST_GEN_DATE,
      );

      let currentVideos = MOCK_VIDEOS;
      if (storedVideosRaw) {
        try {
          const parsedVideos = JSON.parse(storedVideosRaw);
          if (
            Array.isArray(parsedVideos) &&
            parsedVideos.every((v) => v.id && v.title)
          ) {
            currentVideos = parsedVideos;
          }
        } catch {
          console.warn(
            'Could not parse videos from local storage. Starting fresh.',
          );
        }
      }

      if (isNewDay(lastGenDate)) {
        const newVideos = await generateDailyVideos();
        if (newVideos.length > 0) {
          const updatedVideos = [...newVideos, ...currentVideos];
          setVideos(updatedVideos);
          localStorage.setItem(
            LOCAL_STORAGE_KEYS.VIDEOS,
            JSON.stringify(updatedVideos),
          );
          localStorage.setItem(
            LOCAL_STORAGE_KEYS.LAST_GEN_DATE,
            new Date().toISOString(),
          );
        } else {
          setVideos(currentVideos); // Show old videos if generation fails
        }
        setDailyGenerationStatus(null);
      } else {
        setVideos(currentVideos);
      }
    };

    initializeApp();
  }, []); // Run only once on component mount.

  const handlePlayVideo = (video: Video) => {
    setPlayingVideo(video);
  };

  const handleClosePlayer = () => {
    setPlayingVideo(null);
  };

  const handleStartEdit = (video: Video) => {
    setPlayingVideo(null); // Close player
    setEditingVideo(video); // Open edit page
  };

  const handleStartCreate = () => {
    setPlayingVideo(null);
    setEditingVideo({
      id: NEW_VIDEO_ID,
      title: 'Create a new video masterpiece',
      description:
        'A cinematic, photorealistic shot of an astronaut riding a horse on Mars.',
      videoUrl: '',
    });
  };

  const handleCancelEdit = () => {
    setEditingVideo(null); // Close edit page, return to grid
  };

  const handleSaveEdit = async (videoToGenerate: Video) => {
    setEditingVideo(null);
    setIsSaving(true);
    setGenerationError(null);

    try {
      const isNewVideo = videoToGenerate.id === NEW_VIDEO_ID;
      const promptText = videoToGenerate.description;
      console.log('Generating video...', promptText);

      const videoObjects = await generateVideoFromText(promptText);
      if (!videoObjects || videoObjects.length === 0) {
        throw new Error('Video generation returned no data.');
      }
      console.log('Generated video data received.');

      let title = `Remix of "${videoToGenerate.title}"`;
      if (isNewVideo) {
        const titleResponse = await ai.models.generateContent({
          model: TITLE_GENERATION_MODEL_NAME,
          contents: `Generate a short, captivating title (5-7 words) for a video based on this prompt: "${promptText}". Do not include quotes in your response.`,
        });
        title = titleResponse.text.trim();
      }

      const mimeType = 'video/mp4';
      const videoSrc = videoObjects[0];
      const src = `data:${mimeType};base64,${videoSrc}`;

      const newVideo: Video = {
        id: self.crypto.randomUUID(),
        title,
        description: promptText,
        videoUrl: src,
      };

      setVideos((currentVideos) => {
        const updatedVideos = [newVideo, ...currentVideos];
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.VIDEOS,
          JSON.stringify(updatedVideos),
        );
        return updatedVideos;
      });

      setPlayingVideo(newVideo); // Go to the new video
    } catch (error) {
      console.error('Video generation failed:', error);
      setGenerationError([
        'Veo is only available on the Paid Tier.',
        'Please select your Cloud Project to get started.',
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  if (dailyGenerationStatus) {
    return <DailyGenerationLoader status={dailyGenerationStatus} />;
  }

  if (isSaving) {
    return <SavingProgressPage />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {editingVideo ? (
        <EditVideoPage
          video={editingVideo}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      ) : (
        <div className="mx-auto max-w-screen-2xl">
          <header className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text inline-flex items-center gap-4">
                <VideoCameraIcon className="w-10 h-10 md:w-12 md:h-12" />
                <span>Veo Gallery</span>
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Remix existing videos or create your own from scratch.
              </p>
            </div>
            <button
              onClick={handleStartCreate}
              className="flex-shrink-0 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/30"
              aria-label="Create new video">
              <PlusIcon className="w-6 h-6" />
              <span className="font-semibold">Create Video</span>
            </button>
          </header>
          <main className="px-4 md:px-8 pb-8">
            <VideoGrid videos={videos} onPlayVideo={handlePlayVideo} />
          </main>
        </div>
      )}

      {playingVideo && (
        <VideoPlayer
          video={playingVideo}
          onClose={handleClosePlayer}
          onEdit={handleStartEdit}
        />
      )}

      {generationError && (
        <ErrorModal
          message={generationError}
          onClose={() => setGenerationError(null)}
          onSelectKey={async () => await window.aistudio?.openSelectKey()}
        />
      )}
    </div>
  );
};
