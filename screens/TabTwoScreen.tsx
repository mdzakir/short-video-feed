import { FlatList, StyleSheet } from "react-native";

import EditScreenInfo from "../components/EditScreenInfo";
import { Text, View } from "../components/Themed";
import AntDesign from "@expo/vector-icons/AntDesign";
import videoData, { TVideoItem } from "../assets/data";
import { useCallback } from "react";
import { VideoContainer } from "../components/VideoContainer";

export default function TabTwoScreen() {
  const renderItem = useCallback(({ item }) => {
    return <VideoContainer item={item} />;
  }, []);
  return (
    <View style={styles.container}>
      <AntDesign name="arrowleft" size={24} color="black" />
      <FlatList data={videoData} renderItem={renderItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
