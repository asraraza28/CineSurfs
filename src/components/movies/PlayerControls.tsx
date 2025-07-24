import React from "react";

interface PlayerControlsProps {
  type: string;
  genre: string;
  animeEpisode: number;
  setAnimeEpisode: (val: number) => void;
  dub: boolean;
  setDub: (val: boolean) => void;
  skip: number;
  setSkip: (val: number) => void;
  season: number;
  setSeason: (val: number) => void;
  episode: number;
  setEpisode: (val: number) => void;
  availableSeasons?: number[];   // added
  availableEpisodes?: number[]; // added
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  type,
  genre,
  animeEpisode,
  setAnimeEpisode,
  dub,
  setDub,
  skip,
  setSkip,
  season,
  setSeason,
  episode,
  setEpisode,
  availableSeasons = [],     // default to empty if not passed
  availableEpisodes = [],    // default to empty if not passed
}) => {
  const isAnime = type === "anime" || genre.toLowerCase().includes("animation");
  const isSeries = type === "series";

  return (
    <div className="flex flex-wrap gap-3 mt-4 text-sm">
      {isSeries && (
        <>
          <label className="flex flex-col">
            <span className="mb-1 text-xs text-muted-foreground">Season</span>
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="rounded px-3 py-1 bg-muted text-foreground"
            >
              {availableSeasons.length > 0 ? (
                availableSeasons.map((s) => (
                  <option key={s} value={s}>Season {s}</option>
                ))
              ) : (
                <option value={season}>Season {season}</option>
              )}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="mb-1 text-xs text-muted-foreground">Episode</span>
            <select
              value={episode}
              onChange={(e) => setEpisode(Number(e.target.value))}
              className="rounded px-3 py-1 bg-muted text-foreground"
            >
              {availableEpisodes.length > 0 ? (
                availableEpisodes.map((e) => (
                  <option key={e} value={e}>Episode {e}</option>
                ))
              ) : (
                <option value={episode}>Episode {episode}</option>
              )}
            </select>
          </label>
        </>
      )}

      {isAnime && (
        <>
          <label className="flex flex-col">
            <span className="mb-1 text-xs text-muted-foreground">Episode</span>
            <select
              value={animeEpisode}
              onChange={(e) => setAnimeEpisode(Number(e.target.value))}
              className="rounded px-3 py-1 bg-muted text-foreground"
            >
              {[...Array(15)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Ep {i + 1}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="mb-1 text-xs text-muted-foreground">Audio</span>
            <select
              value={dub ? "true" : "false"}
              onChange={(e) => setDub(e.target.value === "true")}
              className="rounded px-3 py-1 bg-muted text-foreground"
            >
              <option value="false">Sub</option>
              <option value="true">Dub</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="mb-1 text-xs text-muted-foreground">Skip Intro</span>
            <select
              value={skip}
              onChange={(e) => setSkip(Number(e.target.value))}
              className="rounded px-3 py-1 bg-muted text-foreground"
            >
              <option value={1}>Skip</option>
              <option value={0}>Don't Skip</option>
            </select>
          </label>
        </>
      )}
    </div>
  );
};

export default PlayerControls;
