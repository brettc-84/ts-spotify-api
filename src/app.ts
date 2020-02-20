import axios from 'axios';
import qs from 'qs';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as readline from 'readline';
import * as inquirer from 'inquirer';

import {config} from 'dotenv';
config();

import { Album } from './types/Album';
import { Artist } from './types/Artist';
import { Track } from './types/Track';


const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_secret = process.env.SPOTIFY_SECRET;

let auth_token = '';

const spotifyAuth = async () => {
  const url = 'https://accounts.spotify.com/api/token';
  const grant_type = 'client_credentials';

  const response = await axios.post(url, qs.stringify({
    grant_type
  }),
    {
      auth: {
        username: spotify_client_id,
        password: spotify_secret
      },
    });

  auth_token = _.get(response, 'data.access_token');
}

const searchArtist = async (artistName: string): Promise<Artist[]> => {
  const url = 'https://api.spotify.com/v1/search';
  const response = await axios.get(url, {
    params: {
      type: 'artist',
      q: artistName,
    },
    headers: { Authorization: `Bearer ${auth_token}` }
  });
  return _.get(response, 'data.artists.items') as Artist[];
}

const getArtistTopTracks = async (id: string): Promise<Track[]> => {
  const url = `https://api.spotify.com/v1/artists/${id}/top-tracks`;
  const response = await axios.get(url, {
    params: {
      country: 'ZA'
    },
    headers: { Authorization: `Bearer ${auth_token}` }
  });
  return _.get(response, 'data.tracks') as Track[];
}

const getArtistAlbums = async (id: string): Promise<string[]> => {
  const url = `https://api.spotify.com/v1/artists/${id}/albums`;
  const response = await axios.get(url, {
    params: {
      country: 'ZA'
    },
    headers: { Authorization: `Bearer ${auth_token}` }
  });
  const albums = _.get(response, 'data.items') as Album[];
  return _.map(_.take(albums, 5), album => album.name);
}

const readFile = (): string[] => {
  const data = fs.readFileSync('artists.txt', 'UTF-8');
  return data.split(/\n/);
}

const main = async () => {
  await spotifyAuth();
  const lines = readFile();
  for (var i = 0; i < lines.length; i++) {
    const artistName = lines[i];
    const artistResults = await searchArtist(artistName);
    console.log(`Artists found for ${artistName}: ${artistResults.length}`)
    if (artistResults.length > 1) {

      const promptChoices = await Promise.all(_.map(artistResults, async (artist) => {
        // let albumNames = [];
        const albumNames = await getArtistAlbums(artist.id);
        return artist.id + ':' + artist.name + ' with albums: '+ albumNames.join(',');
      }));
      promptChoices.push('none:none of the above');
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'artist',
          message: 'There are multiple results, please choose one',
          choices: promptChoices,
        }
      ]);
      console.log(`you chose ${answers.artist}`);
    }


    const artistTopTracks = await getArtistTopTracks(_.first(artistResults).id);
    // _.forEach(artistTopTracks, t => console.log(t.name + ' -- ' + t.album.name));
  }
  // console.log(artistResults);
  // console.log(artistTopTracks);
}

main();
