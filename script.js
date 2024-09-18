'use strict';



class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;
    constructor(coords, distance, duration) {
        // this.date = ...
        // this.id = ...
        this.coords = coords; // [lat,lng]
        this.distance = distance; //in km
        this.duration = duration; // in min
    }
    _setDiscription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    click() {
        this.clicks++;
    }
}
class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadance) {
        super(coords, distance, duration);
        this.cadance = cadance;
        this.calcPace();
        this._setDiscription();

    }
    calcPace() {
        // min/km
        this.pace = this.duration / this.distance
        return this.pace;
    }
}
class Cyclinng extends Workout {
    type = 'cycling'
    constructor(coords, distance, duration, ElevationGain) {
        super(coords, distance, duration);
        this.ElevationGain = ElevationGain;
        this.calcSpeed();
        this._setDiscription();

    }
    calcSpeed() {
        // km/h
        this.speed = this.distance / (this.duration * 60);
        // return this.speed()
    }
}
// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cyclinng([39, -12], 27, 95, 523);
// console.log(run1, cycling1);


/////////////////////////////////////////////
// Application Architecture
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class App {
    #map;
    #mapEvent;
    #mapZoomLevel = 13;
    #workouts = [];
    constructor() {
        // Get users position
        this._getposition()

        // Get data from local storage
        this._getLocalStorage();

        // Attach Event handlers 
        // SUBMITTING THE FORM THAT WE FILLED
        form.addEventListener('submit', this._newWorkout.bind(this))

        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    }
    _getposition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadmap.bind(this), function () {
                alert('Could not get the position');
            });
        }

    }

    _loadmap(position) {

        const { latitude } = position.coords;
        const { longitude } = position.coords;
        console.log(`https://www.google.co.in/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
        // console.log(map)

        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Handling the clicks on the map
        this.#map.on('click', this._showform.bind(this))
        this.#workouts.forEach(work => {
            this._renderWorkoutmarker(work);
        });



    }

    _showform(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();

    }

    _hideForm() {
        // Empty input
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = ' ';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);

    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp))
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);
        e.preventDefault();
        let workout;
        // Get data from user
        const { lat, lng } = this.#mapEvent.latlng;


        // If workout running , create running object
        if (type === 'running') {

            const cadence = +inputCadence.value;
            // Check if data is valid
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)) {
                return alert('Inputs should have positive numbers');
            }
            workout = new Running([lat, lng], distance, duration, cadence);
        }

        // If workout cycling , create cycling object 
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) return alert('Inputs should have positive numbers');
            workout = new Cyclinng([lat, lng], distance, duration, elevation);


        }

        // Add new object to workout array
        this.#workouts.push(workout);
        // console.log(workout)

        // Render workout using map as marker
        this._renderWorkoutmarker(workout);


        // Render workout on list 
        this._renderworkout(workout);
        // Hide the form + clear the input field

        // console.log(this);
        // Clear input fields
        this._hideForm()

        // Set local storage and add the workout to it
        this._setLocalStorage();
        // Submitting the workout Display marker
        // console.log(this.#mapEvent);

    }
    _renderWorkoutmarker(workout) {
        L.marker(workout.coords, { riseOnHover: true }).addTo(this.#map)
            .bindPopup(L.popup({ maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: `${workout.type}-popup` })).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.discription}`)
            .openPopup();


    }
    _renderworkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.discription}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;
        if (workout.type === 'running') {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadance}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
`;
        }
        if (workout.type === 'cycling') {
            html += `
                    <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.ElevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
            </li>
                `;

        }
        form.insertAdjacentHTML('afterend', html);



    }
    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');

        if (!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1
            }
        });
        // using public interface 
        // workout.click();
    }
    _setLocalStorage() {
        localStorage.setItem('workout', JSON.stringify(this.#workouts));
    }
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workout'));

        if (!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderworkout(work);
        });
    }
    reset() {
        localStorage.removeItem('workout');
        location.reload();
    }
}

const app = new App()

