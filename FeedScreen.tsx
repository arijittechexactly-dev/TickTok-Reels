import React, { useRef, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Text, TouchableWithoutFeedback, Pressable } from 'react-native';
import Video, { VideoRef } from 'react-native-video';

const NUM_VIDEOS = 1000;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Example public vertical video URLs (use the same for all for demo, replace with real links as needed)
const SAMPLE_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'; // Not strictly 9:16, but public domain for demo

const videos = Array.from({ length: NUM_VIDEOS }, (_, i) => ({
  id: i.toString(),
  title: `Video #${i + 1}`,
  url: SAMPLE_VIDEO_URL,
}));

const FeedScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pausedMap, setPausedMap] = useState<{ [key: string]: boolean }>({});
  const [progressMap, setProgressMap] = useState<{ [key: string]: number }>({});
  const videoRefs = useRef<{ [key: string]: VideoRef | null }>({});
  const viewabilityConfig = { itemVisiblePercentThreshold: 80 };
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const togglePause = useCallback((id: string) => {
    console.log('togglePause called for id:', id);
    setPausedMap(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleProgress = useCallback((id: string, progress: number) => {
    setProgressMap(prev => ({ ...prev, [id]: progress }));
    if (progress >= 8) {
      setPausedMap(prev => ({ ...prev, [id]: true }));
    }
  }, []);

  const handleReplay = useCallback((id: string) => {
    setPausedMap(prev => ({ ...prev, [id]: false }));
    setProgressMap(prev => ({ ...prev, [id]: 0 }));
    // Seek to 0 using ref
    if (videoRefs.current[id]) {
      videoRefs.current[id]?.seek(0);
    }
  }, []);

  const renderItem = ({ item, index }: { item: { id: string; title: string; url: string }, index: number }) => {
    const isCurrent = index === currentIndex;
    const isPaused = pausedMap[item.id] ?? false;
    console.log(`renderItem: id=${item.id}, isCurrent=${isCurrent}, isPaused=${isPaused}`);
    const progress = progressMap[item.id] ?? 0;
    return (
      <View style={styles.videoContainer}>
        <TouchableWithoutFeedback onPress={() => isCurrent && togglePause(item.id)}>
          <View style={styles.videoWrapper}>
            <Video
              ref={ref => { videoRefs.current[item.id] = ref; }}
              source={{ uri: item.url }}
              style={styles.video}
              resizeMode="cover"
              repeat={false}
              paused={!isCurrent || isPaused}
              muted
              ignoreSilentSwitch="obey"
              playInBackground={false}
              playWhenInactive={false}
              posterResizeMode="cover"
              onProgress={({ currentTime }) => {
                if (isCurrent && !isPaused) handleProgress(item.id, currentTime);
              }}
              onEnd={() => setPausedMap(prev => ({ ...prev, [item.id]: true }))}
            />
            <View style={styles.overlay}>
              <Text style={styles.videoTitle}>{item.title}</Text>
              {isCurrent && isPaused && progress >= 8 && (
                <Pressable onPress={() => handleReplay(item.id)} style={styles.replayBtn}>
                  <Text style={styles.replayText}>Replay</Text>
                </Pressable>
              )}
              {isCurrent && isPaused && progress < 8 && <Text style={styles.pausedText}>Paused - Tap to play</Text>}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };


  return (
    <FlatList
      data={videos}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      decelerationRate="fast"
      getItemLayout={(_, index) => ({
        length: SCREEN_HEIGHT,
        offset: SCREEN_HEIGHT * index,
        index,
      })}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={7}
      removeClippedSubviews
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
    />
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  videoWrapper: {
    width: '90%',
    aspectRatio: 9 / 16,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#444',
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 8,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  pausedText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  replayBtn: {
    marginTop: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  replayText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FeedScreen;
