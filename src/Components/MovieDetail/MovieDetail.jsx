import React, { useEffect, useState } from "react";
import { Rings } from "react-loader-spinner";
import { useParams, useLocation } from "react-router-dom";
import {
  deleteBackend,
  getBackend,
  patchBackend,
  postBackend,
} from "../../Utilities/apiCalls";
import SingleCard from "../Render/SingleCard";
import Error from "../ErrorPage/ErrorPage";
import { CommentSection } from "react-comments-section";
import "react-comments-section/dist/index.css";
import { useUser } from "../../Shared/js/user-context";
// import Swal from "sweetalert2";
import StarRating from "../Render/Stars";

function MovieDetail() {
  let { movieId } = useParams();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [setIsCommentLoaded] = useState(false);
  const [isMovieWatched, setIsMovieWatched] = useState(false);
  const [movie] = useState(location.state.movie);
  const [comments, setComments] = useState(null);
  const [backendMovie, setBackendMovie] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const handleRatingChange = (rating) => {
    setUserRating(rating);
  };
  const {
    state: { user },
  } = useUser();

  const addToWatchlist = () => {
    postBackend({
      url: `api/watchlist/${movieId}`,
      data: {},
    }).then(() => isMovieWatchedFunction());
  };
  const getMovie = () => {
    return postBackend({
      url: "api/movie/" + movieId,
      data: {
        id: +movieId,
        title: movie.title || "",
        release_date: movie.release_date || "",
        overview: movie.overview || "",
        imdbRating: +movie.vote_average || 0,
        poster_path: movie.poster_path || "",
        backdrop_path: movie.backdrop_path || "",
      },
    })
      .then((res) => res.data)
      .then(
        (result) => {
          setBackendMovie(result);
        },
        (error) => {
          setError(error);
        }
      );
  };
  const getComments = () => {
    return getBackend({
      url: `api/comment/${movieId}`,
    })
      .then((res) => res.data)
      .then(
        (result) => {
          setIsCommentLoaded(true);
          let newC = result.data.map((ele) => {
            return {
              userId: ele.userId,
              comId: ele.id,
              fullName: ele.user.firstName + " " + ele.user.lastName,
              text: ele.comment,
              avatarUrl: `https://ui-avatars.com/api/name=${
                ele.user.firstName + "+" + ele.user.lastName
              }&background=random`,
              replies: [],
            };
          });
          setComments(newC);
        },
        (error) => {
          setIsCommentLoaded(true);
          setError(error);
        }
      );
  };
  const getMovieRating = () => {
    return getBackend({
      url: `api/rating/${movieId}`,
    })
      .then((res) => res.data)
      .then((res) => {
        setUserRating(+res.data);
      });
  };
  const isMovieWatchedFunction = () => {
    return postBackend({
      url: `api/watchlist/check/${movieId}`,
    })
      .then((res) => res.data)
      .then((res) => {
        setIsMovieWatched(res.data);
      });
  };
  const removeFromWatchList = () => {
    deleteBackend({
      url: `api/watchlist/${movieId}`,
      data: {},
    }).then(() => isMovieWatchedFunction());
  };
  useEffect(() => {
    Promise.all([getMovie(), getComments(), isMovieWatchedFunction()])
      .then(() => {
        getMovieRating();
      })
      .then(() => {
        setIsLoaded(true);
      });
    // window.scrollTo(0, 0);
  }, [movie]);
  if (error) {
    return <Error error={error.status_message} />;
  } else if (!isLoaded) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Rings color="#0d6efd" height={100} width={100} />
      </div>
    );
  } else
    return (
      <div className="container py-4">
        <div className="row mt-4 py-4 d-flex justify-content-around">
          <div className="col-12 col-sm-2">
            <SingleCard movie={backendMovie}></SingleCard>
            <div className="d-grid gap-2 my-3">
              {!isMovieWatched ? (
                <button
                  type="button"
                  className="button button1 mb-3"
                  onClick={addToWatchlist}
                >
                  <i className="fa fa-plus"></i> Watchlist
                </button>
              ) : (
                <button
                  type="button"
                  className="button buttonSelected mb-3"
                  onClick={removeFromWatchList}
                >
                  <i className="fa fa-check"></i> Added
                </button>
              )}
            </div>
          </div>
          <div className="col-12 col-sm-8">
            <div className="heading">
              <div className="ten">
                <h1>{backendMovie.title}</h1>
              </div>
            </div>
            <div className="my-4">
              <div className="row">
                <div className="col">
                  <div className="user-rating">
                    <h4>User Rating</h4>
                  </div>
                  <StarRating
                    User_ID={user.id}
                    Movie_ID={movieId}
                    userRating={userRating}
                    onChange={handleRatingChange}
                  />
                </div>
                <div className="col">
                  <div className="user-rating">
                    <h4>IMDB Rating</h4>
                    <h4> {movie.vote_average}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="description my-4">{backendMovie.description}</div>
            <div className="comments">
              <CommentSection
                currentUser={{
                  currentUserId: user.id,
                  currentUserImg: `https://ui-avatars.com/api/name=${
                    user.firstName + "+" + user.lastName
                  }&background=random`,
                  currentUserFullName: user.firstName + " " + user.lastName, // names
                }}
                commentData={comments}
                onSubmitAction={(data) => {
                  postBackend({
                    url: "api/comment/" + movieId,
                    data: {
                      comment: data.text,
                    },
                  });
                }}
                onDeleteAction={(data, rest) => {
                  deleteBackend({
                    url: "api/comment/" + data.comIdToDelete,
                  }).then(() => getComments());
                }}
                onEditAction={(data) => {
                  patchBackend({
                    url: "api/comment/" + movieId,
                    data: {
                      id: data.comId,
                      comment: data.text,
                    },
                  }).then(() => getComments());
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
}
export default MovieDetail;
