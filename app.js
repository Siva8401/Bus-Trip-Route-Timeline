/********************************************************
 * PUDUCHERRY BUS CITIZEN WEB APP
 ********************************************************/


/* =====================================================
   CONFIGURATION
===================================================== */

const API_URL =
  'https://script.google.com/macros/s/AKfycbwuzXNZNZs_1lQ-KtK8P7VE6E97-uhepYZsw7qZGeW-LaP-0mAb5l_8ICLIA_1yJ3Mb/exec';


/* =====================================================
   GLOBAL DATA
===================================================== */

let appData = {

  routes: [],

  stops: []

};


let timelineCache =
  new Map();


let activeResults =
  [];


let animationTimer =
  null;


/* =====================================================
   DOM
===================================================== */

const quickSearch =
  document.getElementById(
    'quickSearch'
  );


const clearSearch =
  document.getElementById(
    'clearSearch'
  );


const routeSelect =
  document.getElementById(
    'routeSelect'
  );


const vehicleSelect =
  document.getElementById(
    'vehicleSelect'
  );


const fromSelect =
  document.getElementById(
    'fromSelect'
  );


const toSelect =
  document.getElementById(
    'toSelect'
  );


const findBusButton =
  document.getElementById(
    'findBusButton'
  );


const resetButton =
  document.getElementById(
    'resetButton'
  );


const busResults =
  document.getElementById(
    'busResults'
  );


const emptyState =
  document.getElementById(
    'emptyState'
  );


const loadingState =
  document.getElementById(
    'loadingState'
  );


const resultCount =
  document.getElementById(
    'resultCount'
  );


const resultsSummary =
  document.getElementById(
    'resultsSummary'
  );


const currentTimeElement =
  document.getElementById(
    'currentTime'
  );


const currentDateElement =
  document.getElementById(
    'currentDate'
  );


const connectionDot =
  document.getElementById(
    'connectionDot'
  );


const connectionText =
  document.getElementById(
    'connectionText'
  );


/* =====================================================
   START
===================================================== */

document.addEventListener(
  'DOMContentLoaded',
  initialize
);


async function initialize() {

  updateClock();

  setInterval(
    updateClock,
    1000
  );


  quickSearch.addEventListener(
    'input',
    handleQuickSearch
  );


  clearSearch.addEventListener(
    'click',
    () => {

      quickSearch.value = '';

      renderRouteOptions(
        appData.routes
      );

      renderVehicleOptions(
        appData.routes
      );
    }
  );


  routeSelect.addEventListener(
    'change',
    handleRouteChange
  );


  findBusButton.addEventListener(
    'click',
    searchBuses
  );


  resetButton.addEventListener(
    'click',
    resetFilters
  );


  try {

    await loadMetaData();

    setConnectionStatus(
      true
    );

  } catch (error) {

    console.error(error);

    setConnectionStatus(
      false
    );

    showError(
      'Unable to connect to bus timetable server.'
    );
  }
}


/* =====================================================
   API
===================================================== */

async function apiRequest(
  action,
  params = {}
) {

  const url =
    new URL(API_URL);

  url.searchParams.set(
    'action',
    action
  );


  Object.entries(params)
    .forEach(
      ([key, value]) => {

        url.searchParams.set(
          key,
          value
        );

      }
    );


  const response =
    await fetch(
      url.toString(),
      {
        method: 'GET',
        cache: 'no-store'
      }
    );


  if (!response.ok) {

    throw new Error(
      `HTTP ${response.status}`
    );
  }


  const data =
    await response.json();


  if (!data.success) {

    throw new Error(
      data.error ||
      'API request failed'
    );
  }


  return data;
}


/* =====================================================
   LOAD META
===================================================== */

async function loadMetaData() {

  const data =
    await apiRequest(
      'meta'
    );


  appData.routes =
    data.routes || [];


  appData.stops =
    data.stops || [];


  renderRouteOptions(
    appData.routes
  );


  renderVehicleOptions(
    appData.routes
  );


  renderStopOptions(
    appData.stops
  );
}


/* =====================================================
   ROUTE OPTIONS
===================================================== */

function renderRouteOptions(
  routes
) {

  const current =
    routeSelect.value;


  const unique = {};

  routes.forEach(
    item => {

      const route =
        item.bus || '';

      if (!route) {
        return;
      }

      const key =
        normalize(route);

      if (!unique[key]) {

        unique[key] =
          route;
      }
    }
  );


  const sorted =
    Object.values(unique)
      .sort(naturalCompare);


  routeSelect.innerHTML =
    `<option value="">All Routes</option>`;


  sorted.forEach(
    route => {

      const option =
        document.createElement(
          'option'
        );

      option.value =
        route;

      option.textContent =
        route;

      routeSelect.appendChild(
        option
      );
    }
  );


  if (
    sorted.some(
      x =>
        normalize(x) ===
        normalize(current)
    )
  ) {

    routeSelect.value =
      current;
  }
}


/* =====================================================
   VEHICLE OPTIONS
===================================================== */

function renderVehicleOptions(
  routes
) {

  const current =
    vehicleSelect.value;


  const unique = {};


  routes.forEach(
    item => {

      const vehicle =
        item.vehicle || '';

      if (!vehicle) {
        return;
      }

      const key =
        normalize(vehicle);

      if (!unique[key]) {

        unique[key] =
          vehicle;
      }
    }
  );


  const sorted =
    Object.values(unique)
      .sort(naturalCompare);


  vehicleSelect.innerHTML =
    `<option value="">All Vehicles</option>`;


  sorted.forEach(
    vehicle => {

      const option =
        document.createElement(
          'option'
        );

      option.value =
        vehicle;

      option.textContent =
        vehicle;

      vehicleSelect.appendChild(
        option
      );
    }
  );


  if (
    sorted.some(
      x =>
        normalize(x) ===
        normalize(current)
    )
  ) {

    vehicleSelect.value =
      current;
  }
}


/* =====================================================
   STOP OPTIONS
===================================================== */

function renderStopOptions(
  stops
) {

  fromSelect.innerHTML =
    `<option value="">Select From Stop</option>`;


  toSelect.innerHTML =
    `<option value="">Select To Stop</option>`;


  stops.forEach(
    stop => {

      const fromOption =
        document.createElement(
          'option'
        );

      fromOption.value =
        stop;

      fromOption.textContent =
        stop;

      fromSelect.appendChild(
        fromOption
      );


      const toOption =
        document.createElement(
          'option'
        );

      toOption.value =
        stop;

      toOption.textContent =
        stop;

      toSelect.appendChild(
        toOption
      );
    }
  );
}


/* =====================================================
   ROUTE CHANGE
===================================================== */

function handleRouteChange() {

  const selectedRoute =
    normalize(
      routeSelect.value
    );


  if (!selectedRoute) {

    renderVehicleOptions(
      appData.routes
    );

    return;
  }


  const filtered =
    appData.routes.filter(
      item =>
        normalize(item.bus) ===
        selectedRoute
    );


  renderVehicleOptions(
    filtered
  );
}


/* =====================================================
   QUICK SEARCH
===================================================== */

function handleQuickSearch() {

  const value =
    normalize(
      quickSearch.value
    );


  if (!value) {

    renderRouteOptions(
      appData.routes
    );

    renderVehicleOptions(
      appData.routes
    );

    return;
  }


  const filtered =
    appData.routes.filter(
      item => {

        return (

          normalize(item.bus)
            .includes(value)

          ||

          normalize(item.route)
            .includes(value)

          ||

          normalize(item.vehicle)
            .includes(value)

        );

      }
    );


  renderRouteOptions(
    filtered
  );


  renderVehicleOptions(
    filtered
  );
}


/* =====================================================
   SEARCH BUSES
===================================================== */

async function searchBuses() {

  showLoading(
    true
  );


  try {

    const route =
      normalize(
        routeSelect.value
      );


    const vehicle =
      normalize(
        vehicleSelect.value
      );


    const from =
      normalize(
        fromSelect.value
      );


    const to =
      normalize(
        toSelect.value
      );


    const quick =
      normalize(
        quickSearch.value
      );


    let results =
      appData.routes.filter(
        item => {

          if (
            route &&
            normalize(item.bus) !==
            route
          ) {
            return false;
          }


          if (
            vehicle &&
            normalize(item.vehicle) !==
            vehicle
          ) {
            return false;
          }


          if (quick) {

            const matchesQuick =

              normalize(item.bus)
                .includes(quick)

              ||

              normalize(item.vehicle)
                .includes(quick)

              ||

              normalize(item.route)
                .includes(quick);


            if (!matchesQuick) {
              return false;
            }
          }


          return true;
        }
      );


    const detailedResults =
      [];


    for (
      const routeInfo of results
    ) {

      try {

        const timeline =
          await getTimeline(
            routeInfo.id
          );


        if (
          from &&
          !timelineContainsStop(
            timeline,
            from
          )
        ) {

          continue;
        }


        if (
          to &&
          !timelineContainsStop(
            timeline,
            to
          )
        ) {

          continue;
        }


        if (
          from &&
          to &&
          !hasCorrectStopOrder(
            timeline,
            from,
            to
          )
        ) {

          continue;
        }


        detailedResults.push({
          ...routeInfo,
          timeline
        });

      } catch (error) {

        console.error(
          'Timeline error',
          routeInfo,
          error
        );
      }
    }


    activeResults =
      detailedResults;


    renderResults(
      detailedResults,
      from,
      to
    );


  } catch (error) {

    console.error(error);

    showError(
      error.message
    );

  } finally {

    showLoading(
      false
    );
  }
}


/* =====================================================
   TIMELINE API
===================================================== */

async function getTimeline(
  column
) {

  if (
    timelineCache.has(column)
  ) {

    return timelineCache.get(
      column
    );
  }


  const data =
    await apiRequest(
      'timeline',
      {
        column: column
      }
    );


  const timeline =
    data.timeline || [];


  timelineCache.set(
    column,
    timeline
  );


  return timeline;
}


/* =====================================================
   STOP CHECK
===================================================== */

function timelineContainsStop(
  timeline,
  stop
) {

  return timeline.some(
    point =>
      normalize(point.stop) ===
      stop
  );
}


/* =====================================================
   STOP ORDER
===================================================== */

function hasCorrectStopOrder(
  timeline,
  from,
  to
) {

  const fromIndex =
    timeline.findIndex(
      point =>
        normalize(point.stop) ===
        from
    );


  if (fromIndex === -1) {
    return false;
  }


  return timeline
    .slice(fromIndex + 1)
    .some(
      point =>
        normalize(point.stop) ===
        to
    );
}


/* =====================================================
   RENDER RESULTS
===================================================== */

function renderResults(
  results,
  from,
  to
) {

  busResults.innerHTML =
    '';


  resultCount.textContent =
    results.length;


  if (!results.length) {

    emptyState.classList.remove(
      'hidden'
    );


    emptyState.innerHTML = `

      <div class="empty-icon">
        🔍
      </div>

      <h3>
        No Buses Found
      </h3>

      <p>
        No scheduled bus matches your selected search.
      </p>

    `;


    resultsSummary.textContent =
      'No matching buses found.';


    return;
  }


  emptyState.classList.add(
    'hidden'
  );


  resultsSummary.textContent =
    createSearchSummary(
      results.length,
      from,
      to
    );


  results.forEach(
    (bus, index) => {

      const card =
        createBusCard(
          bus,
          from,
          to,
          index
        );


      busResults.appendChild(
        card
      );
    }
  );


  updateAllBusPositions();
}


/* =====================================================
   SEARCH SUMMARY
===================================================== */

function createSearchSummary(
  count,
  from,
  to
) {

  let text =
    `${count} bus${count === 1 ? '' : 'es'} found`;


  if (from && to) {

    text +=
      ` • ${from} → ${to}`;

  } else if (from) {

    text +=
      ` • From ${from}`;

  } else if (to) {

    text +=
      ` • To ${to}`;
  }


  return text;
}


/* =====================================================
   CREATE BUS CARD
===================================================== */

function createBusCard(
  bus,
  from,
  to,
  index
) {

  const card =
    document.createElement(
      'article'
    );


  card.className =
    'bus-card';


  card.dataset.index =
    index;


  const routeNumber =
    escapeHtml(
      bus.bus ||
      'Bus'
    );


  const routeName =
    escapeHtml(
      bus.route ||
      ''
    );


  const vehicle =
    escapeHtml(
      bus.vehicle ||
      'Vehicle'
    );


  const currentState =
    calculateBusState(
      bus.timeline,
      from,
      to
    );


  if (
    currentState.status ===
    'running'
  ) {

    card.classList.add(
      'live'
    );
  }


  card.innerHTML = `

    <div class="bus-card-header">

      <div>

        <div class="bus-route-number">
          ${routeNumber}
        </div>

        <div class="bus-route-name">
          ${routeName}
        </div>

      </div>

      <div class="vehicle-badge">
        ${vehicle}
      </div>

    </div>


    <div class="live-message">

      <span class="live-status-text">
        ${currentState.message}
      </span>

    </div>


    <div class="timeline">

      <div class="timeline-line"></div>

      <div class="timeline-progress"></div>

      <div class="moving-bus">
        🚌
      </div>

      ${createTimelineStops(
        bus.timeline,
        from,
        to
      )}

    </div>


    <div class="next-stop">

      <div class="next-stop-inner">

        <span class="next-stop-label">
          Next
        </span>

        <span class="next-stop-name">
          ${escapeHtml(
            currentState.nextStop ||
            '—'
          )}
        </span>

      </div>

    </div>

  `;


  return card;
}


/* =====================================================
   TIMELINE STOPS
===================================================== */

function createTimelineStops(
  timeline,
  from,
  to
) {

  let points =
    compressTimeline(
      timeline
    );


  /*
   * If From / To are selected,
   * show only that journey section.
   */

  if (from || to) {

    points =
      filterTimelineBetweenStops(
        points,
        from,
        to
      );
  }


  if (!points.length) {

    return `
      <div class="timeline-stop">
        <div class="stop-content">
          <div class="stop-name">
            No timetable
          </div>
        </div>
      </div>
    `;
  }


  /*
   * Limit visual timeline to avoid
   * extremely long cards.
   */

  const displayPoints =
    points.length > 80
      ? points.slice(0, 80)
      : points;


  return displayPoints
    .map(
      (point, index) => {

        let classes =
          'timeline-stop';


        if (index === 0) {
          classes += ' first';
        }


        if (
          index ===
          displayPoints.length - 1
        ) {
          classes += ' last';
        }


        return `

          <div
            class="${classes}"
            data-minutes="${point.minutes}"
          >

            <div class="stop-dot"></div>

            <div class="stop-content">

              <div class="stop-name">
                ${escapeHtml(
                  point.stop
                )}
              </div>

              <div class="stop-time">
                ${escapeHtml(
                  point.time12
                )}
              </div>

            </div>

          </div>

        `;
      }
    )
    .join('');
}


/* =====================================================
   COMPRESS SAME STOPS
===================================================== */

function compressTimeline(
  timeline
) {

  const result = [];


  timeline.forEach(
    point => {

      if (!point.stop) {
        return;
      }


      const last =
        result[
          result.length - 1
        ];


      if (
        last &&
        normalize(last.stop) ===
        normalize(point.stop)
      ) {

        last.endMinutes =
          point.minutes;

        last.endTime12 =
          point.time12;

      } else {

        result.push({

          stop:
            point.stop,

          minutes:
            point.minutes,

          time12:
            point.time12,

          endMinutes:
            point.minutes,

          endTime12:
            point.time12

        });

      }

    }
  );


  return result;
}


/* =====================================================
   FILTER BETWEEN STOPS
===================================================== */

function filterTimelineBetweenStops(
  points,
  from,
  to
) {

  if (!from && !to) {
    return points;
  }


  let start =
    0;

  let end =
    points.length - 1;


  if (from) {

    const index =
      points.findIndex(
        point =>
          normalize(point.stop) ===
          from
      );


    if (index !== -1) {
      start = index;
    }
  }


  if (to) {

    const index =
      points.findIndex(
        (point, index) =>
          index >= start &&
          normalize(point.stop) ===
          to
      );


    if (index !== -1) {
      end = index;
    }
  }


  if (end < start) {
    return [];
  }


  return points.slice(
    start,
    end + 1
  );
}


/* =====================================================
   BUS STATE
===================================================== */

function calculateBusState(
  timeline,
  from,
  to
) {

  if (!timeline.length) {

    return {

      status: 'none',

      message:
        'No timetable available',

      nextStop: ''

    };
  }


  const now =
    getCurrentMinutes();


  const points =
    compressTimeline(
      timeline
    );


  /*
   * Find current position.
   */

  let currentIndex =
    -1;


  for (
    let i = 0;
    i < points.length;
    i++
  ) {

    const point =
      points[i];


    const next =
      points[i + 1];


    if (!next) {

      if (
        now >= point.minutes
      ) {

        currentIndex =
          i;
      }

      continue;
    }


    if (
      now >= point.minutes &&
      now < next.minutes
    ) {

      currentIndex =
        i;

      break;
    }
  }


  /*
   * Before first trip.
   */

  if (
    now < points[0].minutes
  ) {

    const diff =
      minutesDifference(
        now,
        points[0].minutes
      );


    return {

      status: 'upcoming',

      message:
        `<strong>Next bus</strong> in ${formatRelativeMinutes(diff)}`,

      nextStop:
        points[0].stop

    };
  }


  /*
   * After last point.
   */

  if (
    now >
    points[
      points.length - 1
    ].minutes
  ) {

    return {

      status: 'departed',

      message:
        '<strong>Trip completed</strong> for today',

      nextStop:
        'No more scheduled stops'

    };
  }


  /*
   * Current bus position.
   */

  const current =
    points[currentIndex];


  const next =
    points[currentIndex + 1];


  if (!next) {

    return {

      status: 'running',

      message:
        `<strong>At ${escapeHtml(current.stop)}</strong>`,

      nextStop:
        'Destination'

    };
  }


  const diff =
    minutesDifference(
      now,
      next.minutes
    );


  if (diff <= 1) {

    return {

      status: 'running',

      message:
        `<strong>ARRIVING NOW</strong> at ${escapeHtml(next.stop)}`,

      nextStop:
        next.stop

    };
  }


  return {

    status: 'running',

    message:
      `<strong>On the way</strong> • Next stop ${escapeHtml(next.stop)} in ${formatRelativeMinutes(diff)}`,

    nextStop:
      next.stop

  };
}


/* =====================================================
   UPDATE BUS POSITIONS
===================================================== */

function updateAllBusPositions() {

  const cards =
    document.querySelectorAll(
      '.bus-card'
    );


  cards.forEach(
    card => {

      const index =
        Number(
          card.dataset.index
        );


      const bus =
        activeResults[index];


      if (!bus) {
        return;
      }


      updateBusCardPosition(
        card,
        bus
      );
    }
  );
}


/* =====================================================
   UPDATE ONE BUS
===================================================== */

function updateBusCardPosition(
  card,
  bus
) {

  const timeline =
    compressTimeline(
      bus.timeline
    );


  if (!timeline.length) {
    return;
  }


  const stops =
    card.querySelectorAll(
      '.timeline-stop'
    );


  const movingBus =
    card.querySelector(
      '.moving-bus'
    );


  const progress =
    card.querySelector(
      '.timeline-progress'
    );


  const message =
    card.querySelector(
      '.live-status-text'
    );


  const nextStopElement =
    card.querySelector(
      '.next-stop-name'
    );


  if (!movingBus) {
    return;
  }


  const now =
    getCurrentMinutes();


  /*
   * Timeline visible points.
   */

  const displayedPoints =
    timeline.length > 80
      ? timeline.slice(0, 80)
      : timeline;


  /*
   * Find current segment.
   */

  let currentIndex =
    -1;


  for (
    let i = 0;
    i < displayedPoints.length;
    i++
  ) {

    const current =
      displayedPoints[i];

    const next =
      displayedPoints[i + 1];


    if (!next) {

      if (
        now >= current.minutes
      ) {
        currentIndex = i;
      }

      continue;
    }


    if (
      now >= current.minutes &&
      now < next.minutes
    ) {

      currentIndex = i;

      break;
    }
  }


  /*
   * Before departure.
   */

  if (
    now <
    displayedPoints[0].minutes
  ) {

    setBusVisualPosition(
      movingBus,
      progress,
      stops,
      0
    );


    const diff =
      minutesDifference(
        now,
        displayedPoints[0].minutes
      );


    message.innerHTML =
      `<strong>Next bus</strong> in ${formatRelativeMinutes(diff)}`;


    nextStopElement.textContent =
      displayedPoints[0].stop;


    return;
  }


  /*
   * After trip.
   */

  if (
    now >
    displayedPoints[
      displayedPoints.length - 1
    ].minutes
  ) {

    setBusVisualPosition(
      movingBus,
      progress,
      stops,
      displayedPoints.length - 1
    );


    message.innerHTML =
      '<strong>Trip completed</strong> for today';


    nextStopElement.textContent =
      'No more scheduled stops';


    card.classList.remove(
      'live'
    );


    return;
  }


  /*
   * Current point.
   */

  if (
    currentIndex < 0
  ) {
    currentIndex = 0;
  }


  const current =
    displayedPoints[currentIndex];


  const next =
    displayedPoints[
      currentIndex + 1
    ];


  let fraction =
    0;


  if (next) {

    const duration =
      minutesDifference(
        current.minutes,
        next.minutes
      );


    const elapsed =
      minutesDifference(
        current.minutes,
        now
      );


    if (duration > 0) {

      fraction =
        Math.max(
          0,
          Math.min(
            1,
            elapsed / duration
          )
        );
    }
  }


  const exactPosition =
    currentIndex +
    fraction;


  setBusVisualPositionInterpolated(
    movingBus,
    progress,
    stops,
    exactPosition
  );


  if (next) {

    const remaining =
      minutesDifference(
        now,
        next.minutes
      );


    if (remaining <= 1) {

      message.innerHTML =
        `<strong>ARRIVING NOW</strong> at ${escapeHtml(next.stop)}`;

    } else {

      message.innerHTML =
        `<strong>On the way</strong> • Next stop ${escapeHtml(next.stop)} in ${formatRelativeMinutes(remaining)}`;
    }


    nextStopElement.textContent =
      next.stop;

  } else {

    message.innerHTML =
      `<strong>At ${escapeHtml(current.stop)}</strong>`;

    nextStopElement.textContent =
      'Destination';
  }


  card.classList.add(
    'live'
  );
}


/* =====================================================
   POSITION BUS
===================================================== */

function setBusVisualPosition(
  bus,
  progress,
  stops,
  index
) {

  setBusVisualPositionInterpolated(
    bus,
    progress,
    stops,
    index
  );
}


/* =====================================================
   INTERPOLATED BUS POSITION
===================================================== */

function setBusVisualPositionInterpolated(
  bus,
  progress,
  stops,
  position
) {

  if (!stops.length) {
    return;
  }


  const clamped =
    Math.max(
      0,
      Math.min(
        stops.length - 1,
        position
      )
    );


  const lower =
    Math.floor(
      clamped
    );


  const upper =
    Math.min(
      stops.length - 1,
      lower + 1
    );


  const fraction =
    clamped - lower;


  const first =
    stops[lower];


  const second =
    stops[upper];


  if (!first) {
    return;
  }


  const firstCenter =
    first.offsetTop +
    first.offsetHeight / 2;


  const secondCenter =
    second
      ? second.offsetTop +
        second.offsetHeight / 2
      : firstCenter;


  const y =
    firstCenter +
    (
      secondCenter -
      firstCenter
    ) *
    fraction;


  bus.style.transform =
    `translateY(${y - 21}px)`;


  /*
   * Progress.
   */

  const firstTimeline =
    stops[0];


  const lastTimeline =
    stops[stops.length - 1];


  if (
    firstTimeline &&
    lastTimeline
  ) {

    const start =
      firstTimeline.offsetTop +
      firstTimeline.offsetHeight / 2;


    const end =
      lastTimeline.offsetTop +
      lastTimeline.offsetHeight / 2;


    const percentage =
      end > start
        ? (
            (y - start) /
            (end - start)
          ) * 100
        : 0;


    progress.style.height =
      `${Math.max(0, Math.min(100, percentage))}%`;
  }
}


/* =====================================================
   CLOCK
===================================================== */

function updateClock() {

  const now =
    new Date();


  currentTimeElement.textContent =
    now.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }
    );


  currentDateElement.textContent =
    now.toLocaleDateString(
      'en-IN',
      {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );


  updateAllBusPositions();
}


/* =====================================================
   CURRENT MINUTES
===================================================== */

function getCurrentMinutes() {

  const now =
    new Date();


  return (
    now.getHours() * 60 +
    now.getMinutes() +
    now.getSeconds() / 60
  );
}


/* =====================================================
   MINUTE DIFFERENCE
===================================================== */

function minutesDifference(
  from,
  to
) {

  let diff =
    to - from;


  /*
   * Handle midnight.
   */

  if (diff < 0) {

    diff += 1440;
  }


  return diff;
}


/* =====================================================
   RELATIVE MINUTES
===================================================== */

function formatRelativeMinutes(
  minutes
) {

  minutes =
    Math.max(
      0,
      Math.round(minutes)
    );


  if (minutes <= 0) {
    return 'now';
  }


  if (minutes === 1) {
    return '1 min';
  }


  return `${minutes} mins`;
}


/* =====================================================
   RESET
===================================================== */

function resetFilters() {

  quickSearch.value =
    '';

  routeSelect.value =
    '';

  vehicleSelect.value =
    '';

  fromSelect.value =
    '';

  toSelect.value =
    '';


  renderRouteOptions(
    appData.routes
  );


  renderVehicleOptions(
    appData.routes
  );


  activeResults =
    [];


  busResults.innerHTML =
    '';


  resultCount.textContent =
    '0';


  resultsSummary.textContent =
    'Select a route or stop to view buses.';


  emptyState.classList.remove(
    'hidden'
  );


  emptyState.innerHTML = `

    <div class="empty-icon">
      🚌
    </div>

    <h3>
      Find a Bus
    </h3>

    <p>
      Choose a route, vehicle or stops to see the live timetable.
    </p>

  `;
}


/* =====================================================
   LOADING
===================================================== */

function showLoading(
  state
) {

  if (state) {

    loadingState.classList.remove(
      'hidden'
    );

  } else {

    loadingState.classList.add(
      'hidden'
    );
  }
}


/* =====================================================
   CONNECTION
===================================================== */

function setConnectionStatus(
  online
) {

  if (online) {

    connectionDot.className =
      'status-dot online';


    connectionText.textContent =
      'Live connection';

  } else {

    connectionDot.className =
      'status-dot offline';


    connectionText.textContent =
      'Connection error';
  }
}


/* =====================================================
   ERROR
===================================================== */

function showError(
  message
) {

  emptyState.classList.remove(
    'hidden'
  );


  emptyState.innerHTML = `

    <div class="empty-icon">
      ⚠️
    </div>

    <h3>
      Something went wrong
    </h3>

    <p>
      ${escapeHtml(message)}
    </p>

  `;
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
  value
) {

  return String(value ?? '')
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );
}


/* =====================================================
   NORMALIZE
===================================================== */

function normalize(
  value
) {

  return String(
    value ?? ''
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .toUpperCase();
}


/* =====================================================
   NATURAL SORT
===================================================== */

function naturalCompare(
  a,
  b
) {

  return String(a)
    .localeCompare(
      String(b),
      undefined,
      {
        numeric: true,
        sensitivity: 'base'
      }
    );
}
