
import {Track, Playlist, Section, Master} from './classes.js';
import {getArrayOfTrackIDs, toHHMMSS} from './classes.js';


fetch('./spotify_playlist.json')
      .then(response => response.json())
      .then(data => {
        // map tracks into array
        let imported_tracks = data.tracks.items.map(t => new Track(t.track.id, t.track.duration_ms *0.001));
        // create playlist from fetched data and imported_tracks
        let imported_playlist = new Playlist(data.id, imported_tracks);
        
        //// log results
        //Playlist.logTracks(imported_tracks);
        //console.log("playlist ID:", imported_playlist.id);
        //console.log("playlist duration:", toHHMMSS(imported_playlist.total_time));
        
        let sec1 = new Section("XXX", 10*60, imported_playlist);
        let sec2 = new Section("YYY", 15*60, imported_playlist);
        let sec3 = new Section("ZZZ", 20*60, imported_playlist);
        let secs = [sec1,sec2,sec3];

        let my_master = new Master("testmaster", 45*60, secs);
        my_master.tolerance = 10;
        my_master.generateMaster();
        my_master.logMasterInfo()

        // The generated array of tracks is saved in my_master.tracks:
        //Playlist.logTracks(my_master.tracks);

        // Get a simple array of trackIDs
        let track_list = getArrayOfTrackIDs(my_master.tracks); //NOTE: make it a static function within Masteplaylist class
        console.log(track_list)
    })
      .catch(error => console.error('Error fetching the JSON data:', error));


/*
let list1 = [
    new Track('a1',96),
    new Track('a2',100),
    new Track('a3',172),
    new Track('a4',115),
    new Track('a5',79)
]
let list2 = [
    new Track('b1',358),
    new Track('b2',348),
    new Track('b3',278),
    new Track('b4',121)
]
let list3 = [
    new Track('c1',173),
    new Track('c2',157),
    new Track('c3',107),
    new Track('c4',147),
    new Track('c5',244),
    new Track('c6',185)
]

let play1 = new Playlist( 'aaa', list1);
let play2 = new Playlist( 'bbb', list2);
let play3 = new Playlist( 'ccc', list3);


// Log the total time of the playlist
console.log('Total playlist time:', play1.total_time/60);
console.log('Total playlist time:', play2.total_time/60);
console.log('Total playlist time:', play3.total_time/60);


let sec1 = new Section("XXX", 7*60,  play1);
let sec2 = new Section("YYY", 13*60,  play2);
let sec3 = new Section("ZZZ", 10*60,  play3);

let exit_code = sec1.createTrackList();
sec2.createTrackList();
sec3.createTrackList();
//console.log(exit_code)

let secs = {sec1,sec2,sec3};

let my_master = new Master("testmaster", 20*60);
my_master.addSection(sec1);
my_master.addSection(sec2);
my_master.addSection(sec3);


my_master.generateMaster();

// The array of tracks is saved in my_master.tracks:
Playlist.logTracks(my_master.tracks);

// Get a simple array of trackIDs
let track_list = getArrayOfTrackIDs(my_master.tracks);
console.log(track_list)
*/