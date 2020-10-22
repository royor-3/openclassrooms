import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
  Button,
} from "react-native";
import { getFilmDetailFromApi, getImageFromApi } from "../API/TMDBApi";
import { ScrollView } from "react-native-gesture-handler";
import moment from "moment";
import numeral from "numeral";
import { connect } from "react-redux";
import EnLargeShrink from "../Animations/EnlargeShrink";

class FilmDetail extends React.Component {

  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    // On accède à la fonction shareFilm et au film via les paramètres qu'on a ajouté à la navigation
    if (params.film != undefined && Platform.OS === "ios") {
      return {
        // On a besoin d'afficher une image, il faut donc passe par une Touchable une fois de plus
        headerRight: (
          <TouchableOpacity
            style={styles.share_touchable_headerrightbutton}
            onPress={() => params.shareFilm()}
          >
            <Image
              style={styles.share_image}
              source={require("../Images/ic_share.png")}
            />
          </TouchableOpacity>
        ),
      };
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      film: undefined,
      isLoading: false,
    };

    // Ne pas oublier de binder la fonction _shareFilm sinon, lorsqu'on va l'appeler depuis le headerRight de la navigation, this.state.film sera undefined et fera planter l'application
    this._shareFilm = this._shareFilm.bind(this);
    this._toggleFavorite = this._toggleFavorite.bind(this)
  }

  // Fonction pour faire passer la fonction _shareFilm et le film aux paramètres de la navigation. Ainsi on aura accès à ces données au moment de définir le headerRight
  _updateNavigationParams() {
    this.props.navigation.setParams({
      shareFilm: this._shareFilm,
      film: this.state.film,
    });
  }

  // cette méthode est appelée quand le component à fini d'être rendu
  componentDidMount() {
    const favoriteFilmIndex = this.props.favoritesFilm.findIndex(
      item => item.id === this.props.navigation.state.params.idFilm
    );
    if (favoriteFilmIndex !== -1) {
      // Film déjà dans nos favoris, on a déjà son détail
      // Pas besoin d'appeler l'API ici, on ajoute le détail stocké dans notre state global au state de notre component
      this.setState(
        {
          film: this.props.favoritesFilm[favoriteFilmIndex],
        },
        () => {
          this._updateNavigationParams();
        }
      );
      return;
    }
    // Le film n'est pas dans nos favoris, on n'a pas son détail
    // On appelle l'API pour récupérer son détail
    this.setState({ isLoading: true });
    getFilmDetailFromApi(this.props.navigation.state.params.idFilm).then(
      (data) => {
        this.setState(
          {
            film: data,
            isLoading: false,
          },
          () => {
            this._updateNavigationParams();
          }
        );
      }
    );
  }

  // fonction pour créer de l'affige optionnel (ici une affichage du chargement)
  _displayLoading() {
    // console.log("loading");
    if (this.state.isLoading) {
      return (
        <View style={styles.loading_container}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
  }

  // fonction pour définir l'action pour les films favoris
  _toggleFavorite() {
    const action = { type: "TOGGLE_FAVORITE", value: this.state.film };
    this.props.dispatch(action);
  }

  componentDidUpdate() {
    // console.log(this.props.favoritesFilm);
    // Ce console log permet vérifier que redux fonctionne (en ajoutant et supprimant des films des favoris)
    // mais aussi que le conponent passe bien dans le cycle de vie updating a chaque fois qu'un changement à ieu sur la liste des favoris
  }

  // fonction pour afficher l'image de favoris selon s'il est dans la liste ou non
  _displayFavoriteImage() {
    var sourceImage = require("../Images/ic_favorite_border.png");
    var shouldEnlarge = false // Par défaut, si le film n'est pas en favoris, on veut qu'au clic sur le bouton, celui-ci s'agrandisse => shouldEnlarge à true
    if (
      this.props.favoritesFilm.findIndex(
        (item) => item.id === this.state.film.id
      ) !== -1
    ) {
      sourceImage = require("../Images/ic_favorite.png");
      shouldEnlarge = true // Si le film est dans les favoris, on veut qu'au clic sur le bouton, celui-ci se rétrécisse => shouldEnlarge à false
    }
    return (
      <EnLargeShrink shouldEnlarge={shouldEnlarge}>
        <Image source={sourceImage} style={styles.favorite_image} />
      </EnLargeShrink>  
    );
  }

  _displayFilm() {
    const { film } = this.state;
    if (film != undefined) {
      return (
        <ScrollView style={styles.scrollview_container}>
          <Image
            style={styles.image}
            source={{ uri: getImageFromApi(film.backdrop_path) }}
          />
          <Text style={styles.title_text}>{film.title}</Text>
          <TouchableOpacity
            style={styles.favorite_container}
            onPress={() => this._toggleFavorite()}
          >
            {this._displayFavoriteImage()}
          </TouchableOpacity>
          <Text style={styles.description_text}>{film.overview}</Text>
          <Text style={styles.default_text}>
            Sorti le {moment(new Date(film.release_date)).format("DD/MM/YYYY")}
          </Text>
          <Text style={styles.default_text}>
            Note : {film.vote_average} / 10
          </Text>
          <Text style={styles.default_text}>
            Nombre de votes : {film.vote_count}
          </Text>
          <Text style={styles.default_text}>
            Budget : {numeral(film.budget).format("0,0[.]00 $")}
          </Text>
          <Text style={styles.default_text}>
            Genre(s) :{" "}
            {film.genres
              .map(function (genre) {
                return genre.name;
              })
              .join(" / ")}
            {/* La fonction map() permet de parcourir les genres et companies
            la fonction join permet de les afficher les uns à la suite des autres tout en sélectionnant un séparateur */}
          </Text>
          <Text style={styles.default_text}>
            Companie(s) :{" "}
            {film.production_companies
              .map(function (company) {
                return company.name;
              })
              .join(" / ")}
          </Text>
        </ScrollView>
      );
    }
  }


  // 2 fonctions pour la partie share

  _shareFilm() {
    const { film } = this.state;
    Share.share({ title: film.title, message: film.overview });
  }

  _displayFloatingActionButton() {
    const { film } = this.state;
    if (film != undefined && Platform.OS === "android") {
      // Uniquement sur Android et lorsque le film est chargé
      return (
        <TouchableOpacity
          style={styles.share_touchable_floatingactionbutton}
          onPress={() => this._shareFilm()}
        >
          <Image
            style={styles.share_image}
            source={require("../Images/ic_share.png")}
          />
        </TouchableOpacity>
      );
    }
  }

  render() {
    //   console.log("RENDER")
    // console.log(this.props.navigation)
    // const idFilm = this.props.navigation.state.params.idFilm;
    // ou const idFilm = this.props.navigation.getParam('idFilm')
    // console.log(this.props) // on peut constater que l'on a mapper les films favoris => "favoritesFilm": Array []
    return (
      <View style={styles.main_container}>
        {this._displayFilm()}
        {this._displayLoading()}
        {this._displayFloatingActionButton()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main_container: {
    flex: 1,
  },
  loading_container: {
    position: "absolute", // permet de faire passer la vue du chargement par dessus l'écran
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView_container: {
    flex: 1,
  },
  image: {
    height: 169,
    margin: 5,
  },
  title_text: {
    fontWeight: "bold",
    fontSize: 35,
    flex: 1,
    flexWrap: "wrap",
    marginLeft: 5,
    marginRight: 5,
    marginTop: 10,
    marginBottom: 10,
    color: "#000000",
    textAlign: "center",
  },
  description_text: {
    fontStyle: "italic",
    color: "#666666",
    margin: 5,
    marginBottom: 15,
  },
  default_text: {
    marginLeft: 5,
    marginRight: 5,
    marginTop: 5,
  },
  favorite_container: {
    alignItems: "center",
  },
  favorite_image: {
    flex: 1,
    width: null,
    height: null,
  },
  share_touchable_floatingactionbutton: {
    position: "absolute",
    width: 60,
    height: 60,
    right: 30,
    bottom: 30,
    borderRadius: 30,
    backgroundColor: "#e91e63",
    justifyContent: "center",
    alignItems: "center",
  },
  share_image: {
    width: 30,
    height: 30,
  },
  share_touchable_headerrightbutton: {
    marginRight: 8,
  },
});

// Ici on va connecter les props globales (le state de l'application) aux props du component filmDetail
const mapStateToProps = (state) => {
  // return state //ici on a connecté tout le state de l'application avec le component FilmDetail.
  //  Cependant on ne veut récupérer que les films favoris. On va donc devoir spécifier l'information qui nous interesse
  // (c'est considéré comme une bonne pratique)
  return {
    favoritesFilm: state.favoritesFilm,
  };
};
export default connect(mapStateToProps)(FilmDetail);
