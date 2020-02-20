import { Album } from "./Album";

export interface Track {
  id: string;
  name: string;
  popularity: number;
  uri: string;
  album: Album;
}