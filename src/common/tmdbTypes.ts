export type TMDBCast = {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
};

export type TMDBCrew = {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
};

export type TMDBCredits = {
    cast: TMDBCast[];
    crew: TMDBCrew[];
};

export type TMDBReleaseDate = {
    certification: string;
    release_date: string;
    type: number;
};

export type TMDBReleaseDatesResult = {
    iso_3166_1: string;
    release_dates: TMDBReleaseDate[];
};

export type TMDBContentRating = {
    iso_3166_1: string;
    rating: string;
};

export type TMDBCollection = {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
};

export type TMDBCollectionPart = {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
};

export type TMDBCollectionDetails = {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
    parts: TMDBCollectionPart[];
};

export type TMDBMovie = {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    belongs_to_collection: TMDBCollection | null;
};

export type TMDBTV = {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
};

export type TMDBMovieDetails = TMDBMovie & {
    credits: TMDBCredits;
    release_dates: {
        results: TMDBReleaseDatesResult[];
    };
    similar: {
        results: TMDBMovie[];
    };
    recommendations: {
        results: TMDBMovie[];
    };
    collection?: TMDBCollection;
};

export type TMDBTVDetails = TMDBTV & {
    credits: TMDBCredits;
    content_ratings: {
        results: TMDBContentRating[];
    };
    similar: {
        results: TMDBTV[];
    };
    recommendations: {
        results: TMDBTV[];
    };
};

export type TMDBData = {
    cast: TMDBCast[];
    maturityRating: string | null;
    collection: TMDBCollection | null;
    collectionParts: TMDBCollectionPart[];
    similar: (TMDBMovie | TMDBTV)[];
    recommendations: (TMDBMovie | TMDBTV)[];
    overview: string | null;
};

