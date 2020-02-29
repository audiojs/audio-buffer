declare module 'audio-buffer'{
  /**
   * @property {number} length  — number of samples, minimum is 1.
   * @property {number} sampleRate  — default sample rate is 44100.
   * @property {number} numberOfChannels   — default number of channels is 1.
   */
  interface AudioBufferOptions {
    length?: number;
    sampleRate?: number;
    numberOfChannels?: number;
  }

  class AudioBuffer {
    /** Create audio buffer for audio context based on options.
     * Default context is audio-context singleton.
     * null context can be used to indicate context-free buffer instance,
     * eg. in nodejs.
     */
    //todo: AudioContext type problem, for now using "any"
    constructor(context?:any, options?: AudioBufferOptions);
    /**
     * Duration of the underlying audio data, in seconds.
     */
    duration: number;

    /**
     * Number of samples per channel.
     */

    length: number;

    /**
     * Default sample rate is 44100.
     */
    sampleRate: number;

    /**
     * Default number of channels is 1.
     */
    numberOfChannels: number;

    /**
     * Get array containing the data for the channel (not copied).
     */
    getChannelData(channel: number): number[];

    /**
     * Place data from channel to destination Float32Array.
     */
    copyFromChannel(
      destination: Float32Array,
      channelNumber: number,
      startInChannel?: number
    ):never;

    /**
     * Place data from source Float32Array to the channel.
     */
    copyToChannel(
      source: Float32Array,
      channelNumber: number,
      startInChannel?: number
    ):never;
  }
  export=AudioBuffer;
}
