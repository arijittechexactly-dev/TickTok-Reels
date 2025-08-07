import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Text, TouchableWithoutFeedback, Pressable, ActivityIndicator } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { useSelector } from 'react-redux';
import { fetchVideos } from './videoSlice';
import { useAppDispatch } from './store';
import type { RootState } from './store';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FeedScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pausedMap, setPausedMap] = useState<{ [key: string]: boolean }>({});
  const [progressMap, setProgressMap] = useState<{ [key: string]: number }>({});
  const videoRefs = useRef<{ [key: string]: VideoRef | null }>({});
  const dispatch = useAppDispatch();
  const { videos, loading, error, page, hasMore } = useSelector<RootState, RootState['videos']>(state => state.videos);

  useEffect(() => {
    if (videos.length === 0) {
      dispatch(fetchVideos(1));
    }
  }, [dispatch]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(fetchVideos(page));
    }
  }, [dispatch, loading, hasMore, page]);

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
    // No 8-second pause logic; let video play fully
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
        <View style={styles.videoWrapper}>
          {item.url ? (
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
              onError={err => {
                console.error('Video error', item.url, err);
                setPausedMap(prev => ({ ...prev, [item.id]: true }));
                setProgressMap(prev => ({ ...prev, [item.id]: 0 }));
              }}
              onBuffer={({ isBuffering }) => {
                if (isBuffering) {
                  // Optionally, show spinner overlay
                  // setBuffering(true);
                } else {
                  // setBuffering(false);
                }
              }}
            />
          ) : (
            <View style={[styles.video, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' }]}> 
              <Text style={{ color: '#fff', fontSize: 16 }}>Video unavailable</Text>
            </View>
          )}
          {isCurrent && (
            <View style={styles.centerOverlay} pointerEvents="box-none">
              {isPaused ? (
                progress >= 8 ? (
                  <Pressable onPress={() => handleReplay(item.id)} style={styles.centerButton}>
                    <Text style={styles.centerButtonText}>⟳</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => togglePause(item.id)} style={styles.centerButton}>
                    <Text style={styles.centerButtonText}>▶</Text>
                  </Pressable>
                )
              ) : (
                <Pressable onPress={() => togglePause(item.id)} style={styles.centerButton}>
                  <Text style={styles.centerButtonText}>II</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };


  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 16, marginBottom: 16 }}>Failed to load videos: {error}</Text>
        <Pressable onPress={() => dispatch(fetchVideos(1))} style={{ padding: 12, backgroundColor: '#222', borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (videos.length === 0 && loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#888" />
        <Text style={{ color: '#888', marginTop: 12 }}>Loading videos...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={videos}
      renderItem={({ item, index }: { item: any; index: number }) => {
        // Pick best vertical mp4 file (prefer hd, or highest vertical resolution)
        const verticalFiles = item.video_files.filter((f: any) => f.file_type === 'video/mp4' && f.height > f.width);
        let bestFile = verticalFiles.find((f: any) => f.quality === 'hd') || verticalFiles.sort((a: any, b: any) => (b.height - a.height))[0] || item.video_files[0];
        // Pass bestFile.link as url to video player
        return renderItem({ item: { ...item, url: bestFile?.link || '' }, index });
      }}
      keyExtractor={item => String(item.id)}
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
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading && videos.length > 0 ? <ActivityIndicator style={{ marginVertical: 24 }} size="large" color="#888" /> : null}
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
    width: '100%',
    aspectRatio: 9 / 19,
    backgroundColor: '#000',
    // borderRadius: 16,
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
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  centerButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 40,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  centerButtonText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
});

export default FeedScreen;
