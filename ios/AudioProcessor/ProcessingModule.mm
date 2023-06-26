//
//  ProcessingModule.m
//  AudioProcessor
//
//  Created by Arthur Hayrapetyan on 26.01.23.
//  Copyright © 2023 Krisp Technologies. All rights reserved.
//

#import "ProcessingModule.h"
#include <cmath>
#include <string>
#include <vector>

#include "../lib/inc/krisp-audio-sdk.hpp"

const double PI = 3.14159265358979323846;

bool ProcessingModule::m_isEnableAudioFilter = true;
KrispAudioSessionID sessionId = nullptr;

ProcessingModule::ProcessingModule() : m_sampleRateHz(48000), m_numChannels(1) {}

ProcessingModule::~ProcessingModule() {
    destroy();
}

void ProcessingModule::init() {
    int res = krispAudioGlobalInit(nullptr, 0);
    NSLog(@"ProcessingModule::init = %d", res);
    setModel();
}

void ProcessingModule::reset() {
    NSLog(@"ProcessingModule: reset");
}

void ProcessingModule::resetSampleRate(int newRate) {
    createSession(newRate);
    m_sampleRateHz = newRate;
}

void ProcessingModule::enableNC(const bool isEnable) {
    m_isEnableAudioFilter = isEnable;
}

void ProcessingModule::createSession(int rate) {
    if (sessionId != nullptr) {
        NSLog(@"already created session");
        return;
    }
    sessionId = krispAudioNcCreateSession(
        KRISP_AUDIO_SAMPLING_RATE_48000HZ, KRISP_AUDIO_SAMPLING_RATE_48000HZ, KRISP_AUDIO_FRAME_DURATION_10MS, nullptr);
    NSLog(@"ProcessingModule::createSession sessionId, %p", sessionId);
}

void ProcessingModule::closeSession() {
    NSLog(@"ProcessingModule::closeSession sessionId: %p", sessionId);
    if (sessionId == nullptr) {
        NSLog(@"sessionId is null");
        return;
    }
    krispAudioNcCloseSession(sessionId);
    sessionId = nullptr;
}

void ProcessingModule::destroy() {
    NSLog(@"ProcessingModule::destroy");
    krispAudioGlobalDestroy();
}

void ProcessingModule::initSession(const int sampleRateHz, const int numChannels) {
    m_sampleRateHz = sampleRateHz;
    m_numChannels = numChannels;
}

void ProcessingModule::setName(const std::string &name) {}

void ProcessingModule::setModel() {
    NSBundle *bundle = [NSBundle mainBundle];
    NSString *modelFilePath = [bundle pathForResource:@"model_16" ofType:@"kw"];
    std::string str = modelFilePath.UTF8String;
    std::wstring wideStr = std::wstring(str.begin(), str.end());
    const wchar_t *wideChar = wideStr.c_str();
    if (krispAudioSetModel(wideChar, std::string("model_16").c_str()) != 0) {
        NSLog(@"Error loading AI model");
    }
}

void ProcessingModule::frameProcess(const size_t channelNumber,
                                    const size_t num_bands,
                                    const size_t bufferSize,
                                    float *_Nonnull buffer) {
    if (!m_isEnableAudioFilter || sessionId == nullptr) {
        return;
    }

    int num_frames = (int)bufferSize;
    int rate = num_frames * 100;

    if (rate != m_sampleRateHz) {
        resetSampleRate(rate);
    }

    std::vector<float> bufferIn;
    bufferIn.resize(num_frames);

    for (int index = 0; index < num_frames; ++index) {
        bufferIn[index] = buffer[index] / 32768.f;
    }

    int result = krispAudioNcCleanAmbientNoiseFloat(sessionId, &bufferIn[0], num_frames, buffer, num_frames);
    if (result != 0) {
        NSLog(@"NC failed=%d", result);
    }

    for (int index = 0; index < num_frames; ++index) {
        buffer[index] = buffer[index] * 32768.f;
    }
}
