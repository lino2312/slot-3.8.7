import { _decorator, AudioClip, AudioSource, Component } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    @property(AudioSource)
    bgmAudio: AudioSource = null!;

    @property({ type: [AudioSource] })
    sfxAudioPool: AudioSource[] = [];

    private sfxIndex: number = 0;

    private static effVolume: number = 1.0; // 音效音量
    private static readonly KEY = 'effVolume';

    protected onLoad(): void {
        App.AudioManager = this;

        // 初始化音效音量
        AudioManager.init();

        // 应用音效音量（非常关键）
        this.applyEffVolume();
    }

    public static init(): void {
        const saved = localStorage.getItem(this.KEY);
        if (saved !== null) {
            const val = parseFloat(saved);
            if (!isNaN(val)) {
                this.effVolume = Math.max(0, Math.min(1, val));
            }
        }
    }

    /** ========= BGM ========== */
    public playBGM(path: string, iscommon?: boolean) {
        App.ResUtils.getRes(path, AudioClip, iscommon)
            .then((clip: AudioClip) => {
                if (this.bgmAudio.playing) {
                    this.bgmAudio.stop();
                }
                this.bgmAudio.clip = clip;
                this.bgmAudio.loop = true;
                this.bgmAudio.play();
            })
            .catch((err) => {
                console.warn('背景音乐加载失败:', path, err);
            });
    }

    public setBgmVolume(volume: number) {
        this.bgmAudio.volume = volume;
    }

    public getBgmVolume(): number {
        return this.bgmAudio.volume;
    }

    /** ========= SFX ========== */
    //iscommon 是否共用
    public playSfx(path: string, filenameOrCallback?: string | Function, callback?: Function, endCallback?: Function, iscommon?: boolean): void {
        let fullPath: string;
        let cb: Function | undefined;

        if (typeof filenameOrCallback === 'string') {
            fullPath = path + filenameOrCallback;
            cb = callback;
        } else {
            fullPath = path;
            cb = filenameOrCallback as Function;
        }

        App.ResUtils.getRes(fullPath, AudioClip, iscommon)
            .then((clip: AudioClip) => {
                const audioSource = this.sfxAudioPool[this.sfxIndex];
                this.sfxIndex = (this.sfxIndex + 1) % this.sfxAudioPool.length;

                if (audioSource.playing) {
                    audioSource.stop();
                }

                audioSource.clip = clip;

                // ⭐ 关键：使用当前音效音量
                audioSource.volume = AudioManager.effVolume;
                if (endCallback && typeof endCallback === 'function') {
                    audioSource.node.once(
                        AudioSource.EventType.ENDED,
                        endCallback
                    );
                }
                audioSource.play();

                if (cb) cb();
                console.log("正在播放音效:", clip.name, "volume=", audioSource.volume);

            })
            .catch((err) => {
                console.warn('音效加载失败:', fullPath, err);
            });
    }

    public setSfxVolume(volume: number) {
        this.sfxAudioPool.forEach(audio => audio.volume = volume);
    }

    public setEffVolume(volume: number): void {
        const vol = Math.max(0, Math.min(1, volume));

        AudioManager.effVolume = vol;
        localStorage.setItem(AudioManager.KEY, vol.toString());

        this.applyEffVolume();
    }

    /** 将 effVolume 应用到所有音效（开关才能生效）*/
    private applyEffVolume() {
        this.sfxAudioPool.forEach(a => {
            a.volume = AudioManager.effVolume;
        });
    }

    public getEffVolume(): number {
        return AudioManager.effVolume;
    }

    /** ========= 工具函数 ========== */
    public playBtnClick() {
        this.playSfx("audio/button/btn_click");
    }

    public playBtnClick2() {
        this.playSfx("audio/button/btn_click_2");
    }

    public pauseBGM() {
        this.bgmAudio.pause();
    }

    public resumeBGM() {
        this.bgmAudio.play();
    }

    public stopBGM() {
        this.bgmAudio.stop();
    }

    public pauseAllSfx() {
        this.sfxAudioPool.forEach(audio => audio.pause());
    }

    public resumeAllSfx() {
        this.sfxAudioPool.forEach(audio => audio.play());
    }

    public stopAllSfx() {
        this.sfxAudioPool.forEach(audio => audio.stop());
    }
    public setMusicVolume(volume: number) {
        if (this.bgmAudio) this.bgmAudio.volume = volume;
    }


    public stopAll() {
        this.bgmAudio.stop();
        this.stopAllSfx();
    }
}
