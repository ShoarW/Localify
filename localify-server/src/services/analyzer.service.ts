import { Essentia, EssentiaWASM } from "essentia.js";
import { getTrackPathById } from "../db/track.db.js";
import { saveAudioFeatures, getAudioFeatures } from "../db/track.db.js";
import { db } from "../db/db.js";
import fs from "fs";
import { AudioContext } from "web-audio-api";

let essentia: any = null;
let audioContext: any = null;

// Initialize essentia WASM
async function initEssentia() {
  if (!essentia) {
    essentia = new Essentia(await EssentiaWASM);
    console.log("Essentia version:", essentia.version);
    console.log("Available algorithms:", essentia.algorithmNames);
  }
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return essentia;
}

async function loadAudioFile(filePath) {
  // Read the file
  const buffer = await fs.promises.readFile(filePath);

  // Decode the WAV file
  const { sampleRate, channelData } = decode(buffer);

  // If stereo, convert to mono by averaging channels
  if (channelData.length > 1) {
    const monoData = new Float32Array(channelData[0].length);
    for (let i = 0; i < channelData[0].length; i++) {
      monoData[i] = 0;
      for (let channel = 0; channel < channelData.length; channel++) {
        monoData[i] += channelData[channel][i];
      }
      monoData[i] /= channelData.length;
    }
    return { audioData: monoData, sampleRate };
  }

  // If mono, just return the first channel
  return { audioData: channelData[0], sampleRate };
}

async function processAudioFrames(audioData: Float32Array, essentia: any) {
  // Generate overlapping frames
  const frames = essentia.FrameGenerator(
    audioData,
    2048, // frameSize
    1024 // hopSize
  );

  const frameFeatures = [];

  // Process each frame
  for (let i = 0; i < frames.size(); i++) {
    const frame = frames.get(i);

    // Apply windowing
    const windowedFrame = essentia.Windowing(frame, "hann").frame;

    // Extract spectral features for this frame
    const spectrum = essentia.Spectrum(windowedFrame).spectrum;
    const spectralFeatures = essentia.SpectralExtractor(spectrum);

    frameFeatures.push(spectralFeatures);
  }

  return frameFeatures;
}

export async function analyzeTrack(trackId: number): Promise<{
  bpm: number;
  key: string;
  scale: string;
  danceability: number;
  energy: number;
  loudness: number;
  instrumentalness: number;
  acousticness: number;
  moodValence: number;
} | null> {
  try {
    // Check if analysis already exists
    const existingAnalysis = await getAudioFeatures(db, trackId);
    if (existingAnalysis) {
      return existingAnalysis;
    }

    const trackPath = getTrackPathById(db, trackId);
    if (!trackPath) {
      throw new Error("Track not found");
    }

    // Initialize essentia
    const essentia = await initEssentia();

    // Load and prepare audio data
    const audioData = await loadAudioFile(trackPath);

    /*
    // Process frames
    const frameFeatures = await processAudioFrames(audioData, essentia);

    // Analyze rhythm features
    const rhythmExtractor = essentia.RhythmExtractor2013();
    const rhythmFeatures = rhythmExtractor(audioData);
    const bpm = rhythmFeatures.bpm;

    // Analyze key and scale
    const keyExtractor = essentia.KeyExtractor();
    const keyFeatures = keyExtractor(audioData);
    const key = keyFeatures.key;
    const scale = keyFeatures.scale;

    // Calculate aggregate features from frame analysis
    const energy = calculateAverageEnergy(frameFeatures);
    const loudness = calculateAverageLoudness(frameFeatures);
    const acousticness = calculateAverageAcousticness(frameFeatures);

    // Calculate other high-level features
    const danceability = await calculateDanceability(audioData, essentia);
    const instrumentalness = await calculateInstrumentalness(
      audioData,
      essentia
    );
    const moodValence = await calculateMoodValence(audioData, essentia);

    // Save features to database
    const features = {
      trackId,
      bpm,
      key,
      scale,
      danceability,
      energy,
      loudness,
      instrumentalness,
      acousticness,
      moodValence,
    };

    await saveAudioFeatures(db, features);
    return features;

    */

    return null;
  } catch (error) {
    console.error(`Error analyzing track ${trackId}:`, error);
    return null;
  }
}

// Helper functions for feature calculation
async function calculateDanceability(
  audioData: Float32Array,
  essentia: any
): Promise<number> {
  const rhythmDescriptors = essentia.RhythmDescriptors();
  const features = rhythmDescriptors(audioData);
  return (features.danceability + features.rhythm_regularity) / 2;
}

function calculateAverageEnergy(frameFeatures: any[]): number {
  const energies = frameFeatures.map(
    (features) =>
      (features.spectral_energy +
        features.spectral_energyband_high +
        features.spectral_energyband_middle_high) /
      3
  );
  return energies.reduce((a, b) => a + b, 0) / energies.length;
}

function calculateAverageLoudness(frameFeatures: any[]): number {
  const loudness = frameFeatures.map((features) => features.loudness);
  return loudness.reduce((a, b) => a + b, 0) / loudness.length;
}

async function calculateInstrumentalness(
  audioData: Float32Array,
  essentia: any
): Promise<number> {
  const voiceDetector = essentia.VoiceDetector();
  const features = voiceDetector(audioData);
  return 1 - features.voice_presence;
}

function calculateAverageAcousticness(frameFeatures: any[]): number {
  const acousticness = frameFeatures.map(
    (features) => (features.spectral_complexity + features.spectral_rolloff) / 2
  );
  return acousticness.reduce((a, b) => a + b, 0) / acousticness.length;
}

async function calculateMoodValence(
  audioData: Float32Array,
  essentia: any
): Promise<number> {
  const moodValence = essentia.MoodValence();
  return moodValence(audioData);
}
