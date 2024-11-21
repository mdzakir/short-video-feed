import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused, useScrollToTop } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import {
  useCallback,
  useRef,
  memo,
  useContext,
  forwardRef,
  useState,
  useMemo,
} from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaFrame } from "react-native-safe-area-context";

import {
  ItemKeyContext,
  ViewabilityItemsContext,
  ViewabilityTrackerFlashList,
} from "../components/ViewabilityTrackerFlashList";
import { RootTabScreenProps } from "../types";
import { ResizeMode, Video, VideoProps } from "expo-av";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import videoData, { TVideoItem } from "../assets/data";

const ReelVideo = memo(
  forwardRef<Video, VideoProps>((props, ref) => {
    const frame = useSafeAreaFrame();
    const tabBarHeight = useBottomTabBarHeight() || 48;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const videoWidth = useMemo(() => frame.width, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const videoHeight = useMemo(() => frame.height - tabBarHeight, []);
    return (
      <Video
        ref={ref}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        style={{ height: videoHeight, width: videoWidth }}
        videoStyle={{
          height: "100%",
          width: "100%",
        }}
        {...props}
      />
    );
  })
);

const ReelVideoItemContainer = memo(({ data }: { data: TVideoItem }) => {
  const id = useContext(ItemKeyContext)!;
  const context = useContext(ViewabilityItemsContext);
  const videoRef = useRef<Video>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const hasFocus = useIsFocused();

  // this check is specific for recycling with FlashList
  // inside this statement, do everything to reset the item, like position etc
  // you can use anything to compare, like the url, or the id
  const currentVideo = useRef<string>();

  if (currentVideo.current !== data.url) {
    currentVideo.current = data.url;
    setIsVisible(false);

    // since this video can be recycled, we need to reset it's position
    // its an async function but we don't need to wait for it to finish
    // we can even offload it to the UI thread with runOnUI
    if (videoRef.current) {
      videoRef.current.setPositionAsync(0).catch(() => {});
    }
  }

  const visibleAction = () => {
    requestAnimationFrame(() => {
      // you could also do this imperatively instead of calling useState
      //videoRef.current?.playAsync();

      // here would be also place for adding logic if the current video has already been played
      // and to reset it to the beginning. This is not implemented here

      setIsVisible(true);
    });
  };

  const invisibleAction = () => {
    requestAnimationFrame(() => {
      //videoRef.current?.stopAsync();
      setIsVisible(false);
    });
  };

  // we stop or play the Video depending on the list visibility state
  useAnimatedReaction(
    () => context.value,
    (ctx) => {
      if (ctx.includes(id)) {
        // do stuff on item visible
        runOnJS(visibleAction)();
      } else if (!ctx.includes(id)) {
        // do stuff on item invisible
        runOnJS(invisibleAction)();
      }
    }
  );

  return (
    <ReelVideo
      ref={videoRef}
      source={{ uri: data?.url }}
      resizeMode={ResizeMode.COVER}
      shouldPlay={isVisible && hasFocus}
      isMuted={false}
      volume={1}
      isLooping={true}
    />
  );
});

export default function TabOneScreen({
  navigation,
}: RootTabScreenProps<"TabOne">) {
  const tabBarHeight = useBottomTabBarHeight() || 48;
  const frame = useSafeAreaFrame();
  const deviceHeight = Dimensions.get("window").height;
  // const videoHeight = useMemo(() => deviceHeight - tabBarHeight, []);
  const videoHeight = useMemo(() => frame.height - tabBarHeight, []);
  // const videoHeight = frame.height - tabBarHeight;
  console.log("deviceHeight", deviceHeight);
  console.log("tabBarHeight", tabBarHeight);

  const flashlistRef = useRef<FlashList<any>>(null);

  const renderItem = useCallback(({ item }: { item: TVideoItem }) => {
    return <ReelVideoItemContainer data={item} />;
  }, []);

  //@ts-ignore
  useScrollToTop(flashlistRef);

  return (
    <View style={styles.container}>
      <ViewabilityTrackerFlashList
        ref={flashlistRef}
        data={videoData}
        renderItem={renderItem}
        drawDistance={videoHeight}
        estimatedItemSize={videoHeight}
        disableIntervalMomentum={true}
        decelerationRate={"fast"}
        showsVerticalScrollIndicator={false}
        pagingEnabled={true}
        snapToInterval={Platform.OS === "android" ? videoHeight : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#333",
  },
});
