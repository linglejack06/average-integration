const { createClient } = require('@supabase/supabase-js')

const supabase = createClient("https://ozkykrmuikqgrjfwemus.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96a3lrcm11aWtxZ3JqZndlbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg1NTgzOTQsImV4cCI6MjAyNDEzNDM5NH0.uw5P0WARTEleBzhNtraLsCEO2wp781rSzggxDI9dm8s");

const fetchTeamData = async () => {
    return supabase.from('Scout_Data').select("Event, team, Auto_Amp_Made, Auto_Speaker_Made, Taxi, Teleop_Amp_Made, Teleop_Speaker_Made, Endgame, Trap");
}

const average = (oldAvg, newVal, denom) => {
    return ((oldAvg * (denom - 1) + newVal) / denom).toFixed(2);
}

const addAverages =  async (teamNumber, event, teamPoints) => {
    const avg = {
        teamNumber,
        event,
        matchesPlayed: 0,
        teleAmp: 0,
        teleSpeaker: 0,
        autoAmp: 0,
        autoSpeaker: 0,
        climb: 0,
        trapPercent: 0,
        taxiPercent: 0,
    };
    for(let i = 0; i < teamPoints.length; i++) {
        const match = teamPoints[i];
        let climbPoints = 0;
        if(match.Endgame === "Parked") {
            climbPoints = 1;
        } else if (match.Endgame === "Climbed") {
            climbPoints = 3;
        } else if (match.Endgame === 'Not Attempted') {
            climbPoints = 0;
        } else {
            climbPoints = 5;
        }
        avg.matchesPlayed++;
        avg.teleAmp = average(avg.teleAmp, match.Teleop_Amp_Made, i + 1);
        avg.teleSpeaker = average(avg.teleSpeaker, match.Teleop_Speaker_Made, i + 1);
        avg.autoAmp = average(avg.autoAmp, match.Auto_Amp_Made, i + 1);
        avg.autoSpeaker = average(avg.autoSpeaker, match.Auto_Speaker_Made, i + 1);
        avg.climb = average(avg.climb, climbPoints, i + 1);
        avg.trapPercent = average(avg.trapPercent, match.Trap === "Successful" ? 100 : 0, i + 1);
        avg.taxiPercent = average(avg.taxiPercent, match.Taxi ? 100 : 0, i + 1);
    }
    await supabase.from('Averages').delete().eq('teamNumber', avg.teamNumber).eq('event', avg.event);
    return supabase.from('Averages').insert(avg);

}

const addAllAverages = async (competition) => {
    const { data, error} = await fetchTeamData();
    if(error) throw (error);

    const resp = await fetch("https://www.thebluealliance.com/api/v3/event/" + competition + "/teams/simple",
        {
            method: "GET",
            headers: {
                "X-TBA-Auth-Key":
                    "3MbBFKbSOrahWa5SA7GmFv6L9ByIly1nk0vUPPSK1xQnI4ccLvsF5FRknNFz1CAm",
            },
        });
    if(!resp.ok) {
        throw { message: resp.status }
    }

    const jsonResp = await resp.json();
    const teamsArray = jsonResp.map((d) => d.team_number.toString());

    console.log(teamsArray);

    for(let i = 0; i < teamsArray.length; i++) {
        const teamData = data.filter((d) => d.team === teamsArray[i]);

        const averageData = await addAverages(teamsArray[i], competition, teamData);
        if(averageData.error) {
            throw averageData.error;
        }
    }
}

module.exports = addAllAverages;
