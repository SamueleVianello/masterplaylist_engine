
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

export function arrayCopy(arr){
    return arr.map( item =>{ return {...item}} );
}

export function toHHMMSS( s){
    let neg_flag = s<0;
    s = Math.abs(s);
    let h= Math.floor(s/3600);
    let min = Math.floor((s-h*3600)/60);
    let sec = Math.floor(s-h*3600-min*60);
    let str_h = (h<1 ?"" :( h<10 ? "0":"")+h +":");
    let str_min = ( min<10 ? "0":"") +min+":";
    let str_sec = (sec<10 ? "0":"") +sec;
    return  (neg_flag? "-":"")+str_h+str_min+str_sec;
}

export function getArrayOfTrackIDs(tracks){
    return tracks.map( (t) => t.id);
}


export class Track {
    constructor(track_id, total_time) {
        this.id = track_id;
        this.total_time = total_time;  // Fixed this line
    }

    copy(){
        return new Track(this.id, this.total_time)
    }

    toJSON() {
        return Object.getOwnPropertyNames(this).reduce((a, b) => {
          a[b] = this[b];
          return a;
        }, {});
    }
}


export class Playlist {
    constructor(id, tracks = []) {
        this.id = id;
        this.tracks = tracks;
        this.total_time = this.tracks.reduce((sum, track) => sum + track.total_time, 0);
        //this.updateTotalTime();  // Initialize total_time
    }

    addTrack(track) {
        this.tracks.push(track);
        this.updateTotalTime();
    }

    updateTotalTime() {
        this.total_time = this.tracks.reduce((sum, track) => sum + track.total_time, 0);  // Fixed this line
    }

    logTracks(){
        const trackIds = this.tracks.map(track => track.id);
        console.log('Track IDs:', trackIds);
    }

    copy(){
        return new Playlist(this.id, arrayCopy(this.tracks));
    }

    toJSON() {
        return Object.getOwnPropertyNames(this).reduce((a, b) => {
          a[b] = this[b];
          return a;
        }, {});
    }

    static calculateTotalTime(tracks) {
        return tracks.reduce((sum, track) => sum + track.total_time, 0);  // Fixed this line
    }

    static logTracks(tracks){
        const trackIds = tracks.map(track => ""+track.id + '  ' +toHHMMSS(track.total_time));
        console.log('Track IDs:', trackIds);
    }
}


export class Section{
    constructor(id, total_time, playlist){
        this.id = id;
        this.total_time = total_time;
        this.playlist = playlist;
        this.tracks = [];
        this.within_tolerance = false;


        // technical variables
        this.actual_time = 0;  //actual length of generate track_list
        this.excess_time = 0; // how much actual_time is away from the total_time
    }

    createTrackList( tolerance = 60, start_time = 0){
        //console.log("STARTING TRACKLIST CREATION")
        //console.log("Start time", toHHMMSS(start_time));

        // Make sure we can fill the section with linked playlist, otherwise exit with error
        if ((this.total_time - this.playlist.total_time ) > tolerance) {
            return -99;
        }

        // copy and shuffle the tracks in the playlist
        let shuffled_tracks = this.playlist.tracks.map( item =>{ return {...item}}); // magic trick to clone array
        shuffleArray(shuffled_tracks); 

        // select all tracks up to the one that makes us exceed the available time (total_time - start_time) 
        let i = -1;
        let curr_list = [];
        let curr_time = 0;
        let len = shuffled_tracks.length;
        let tol_check = Math.abs( curr_time-(this.total_time - start_time)) < tolerance;
        while ( ((i+1) < len) &  (curr_time < (this.total_time-start_time)) & !tol_check) {
            ++i;
            //console.log("checking "+i);
            curr_list.push(shuffled_tracks[i]);
            curr_time += shuffled_tracks[i].total_time;
            tol_check = (Math.abs( curr_time-(this.total_time - start_time)) < tolerance);
            //console.log((Math.abs( curr_time-(this.total_time - start_time)) < tolerance))
        }

        // if curr_time is NOT within tolerance try to swap last track for a better one
        if (!tol_check){
            curr_list.pop();
            curr_time -= shuffled_tracks[i].total_time;
            let best_i = i;
            let best_diff = Math.abs(curr_time + shuffled_tracks[i].total_time -(this.total_time - start_time));
            
            console.log(tol_check);
            while(i<len & !tol_check){
                tol_check = (Math.abs(curr_time + shuffled_tracks[i].total_time -(this.total_time - start_time)) < tolerance);
                let curr_diff = Math.abs(curr_time + shuffled_tracks[i].total_time -(this.total_time - start_time));
                if (curr_diff<best_diff){
                    best_i = i;
                    best_diff = curr_diff;
                }
                ++i;
            }

            curr_list.push(shuffled_tracks[best_i]);
            curr_time += shuffled_tracks[best_i].total_time;
            this.within_tolerance = tol_check;
        }
        // TODO (eventually if needed): improve the selection using KNAPSACK optimization? Recursive functions (Wave function collapse)? 
        
        this.tracks = curr_list;
        this.updateActualTime();
        this.excess_time = this.actual_time - this.total_time;
        console.log("Execess time", toHHMMSS(this.excess_time));
        // console.log("END TRACKLIST CREATION")

        return 0;
    }


    updateActualTime() {
        this.actual_time = this.tracks.reduce((sum, track) => sum + track.total_time, 0);
    }

    copy(){
        return new Section(this.id, this.total_time, this.playlist.copy());
    }

    toJSON() {
        return Object.getOwnPropertyNames(this).reduce((a, b) => {
          a[b] = this[b];
          return a;
        }, {});
    }
}


export class Master{
    constructor(id, total_time, sections = []){
        this.id = id;
        this.total_time = total_time;
        this.sections = sections;
        this.tracks = [];
        this.tolerance = 60;

        // technical variables
        this.actual_time;  //actual length of generate track_list
        this.excess_time = 0; // how much actual_time is away from the total_time
        
    }

    addSection( sect){
        this.sections.push(sect);
    }

    generateMaster(){
        //TODO improve code
        let n = this.sections.length;
        console.log(n);
        let extra_time = 0;
        let tolerance = 60;
        for(let i =0; i<n; i++){
            this.sections[i].createTrackList(this.tolerance, extra_time);
            extra_time = this.sections[i].excess_time;
            this.tracks = this.tracks.concat(this.sections[i].tracks);
        }

        this.updateActualTime();
        this.excess_time = this.actual_time - this.total_time;
    }

    getArrayOfTrackIDs(){
        return this.tracks.map( (t) => t.id);
    }

    updateActualTime() {
        this.actual_time = this.tracks.reduce((sum, track) => sum + track.total_time, 0);
    }

    logMasterInfo(){
        console.log("***************** MASTER_PLAYILIST: " + this.id + " *****************");
        console.log()
        console.log("------------------------------------------------");
        let N = this.sections.length;
        for(let i =0; i<N; i++){
            console.log("Section ", i);
            console.log("ID: ",this.sections[i].id);
            console.log("Number of tracks", this.sections[i].tracks.length);
            console.log("Required time", toHHMMSS(this.sections[i].total_time));
            console.log("Actual time", toHHMMSS(this.sections[i].actual_time));
            //console.log("Required time", this.sections[i].total_time);
            console.log("Tolerance " + (this.sections[i].within_tolerance? "PASSED :)":"FAILED :("));

            console.log("------------------------------------------------");
        }

        console.log("ACTUAL TIME:", toHHMMSS(this.actual_time));
        console.log("EXCESS TIME:", toHHMMSS(this.excess_time));
        console.log("********************************************************");
    }

    toJSON() {
        return Object.getOwnPropertyNames(this).reduce((a, b) => {
          a[b] = this[b];
          return a;
        }, {});
    }
}