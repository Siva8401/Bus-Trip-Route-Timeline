const API_URL =
  'https://script.google.com/macros/s/AKfycbzP5oXNTIBVdnOMS20PTSka1BQe6BueeyLg9P78uOBHZZybPUrKv1xpW_nTUdCuZd2r/exec';


/* =====================================================
   STATE
===================================================== */

const state = {

  meta: {
    routes: [],
    stops: []
  },

  results: [],

  selectedFrom: '',
  selectedTo: '',

  lastSearch: null,

  loading: false
};


/* =====================================================
   DOM
===================================================== */

const $ = id =>
  document.getElementById(id);


const quickSearch =
  $('quickSearch');

const clearSearch =
  $('clearSearch');

const fromSelect =
  $('fromSelect');

const toSelect =
  $('toSelect');

const busSelect =
  $('busSelect');

const routeSelect =
  $('routeSelect');

const vehicleSelect =
  $('vehicleSelect');

const searchButton =
  $('searchButton');

const resetButton =
  $('resetButton');

const swapButton =
  $('swapButton');

const refreshButton =
  $('refreshButton');

const busResults =
  $('busResults');

const emptyState =
  $('emptyState');

const loadingState =
  $('loadingState');

const resultCount =
  $('resultCount');

const resultsSummary =
  $('resultsSummary');

const currentTime =
  $('currentTime');

const currentDate =
  $('currentDate');

const connectionDot =
  $('connectionDot');

const connectionText =
  $('connectionText');


/* =====================================================
   INIT
===================================================== */

document.addEventListener(
  'DOMContentLoaded',
  init
);


async function init() {

  updateClock();


  setInterval(
    updateClock,
    1000
  );


  searchButton.addEventListener(
    'click',
    searchBuses
  );


  resetButton.addEventListener(
    'click',
    resetAll
  );


  swapButton.addEventListener(
    'click',
    swapStops
  );


  clearSearch.addEventListener(
    'click',
    () => {

      quickSearch.value = '';

    }
  );


  refreshButton.addEventListener(
    'click',
    refreshData
  );


  quickSearch.addEventListener(
    'keydown',
    event => {

      if (
        event.key === 'Enter'
      ) {

        searchBuses();
      }
    }
  );


  try {

    await loadMeta();

    setConnection(
      true
    );

  } catch (error) {

    console.error(error);

    setConnection(
      false
    );

    showError(
      'Unable to load bus information.'
    );
  }
}


/* =====================================================
   API
===================================================== */

async function api(
  action,
  params = {}
) {

  const url =
    new URL(
      API_URL
    );


  url.searchParams.set(
    'action',
    action
  );


  Object.keys(params)
    .forEach(
      key => {

        if (
          params[key] !==
          undefined &&
          params[key] !==
          null &&
          params[key] !== ''
        ) {

          url.searchParams.set(
            key,
            params[key]
          );
        }
      }
    );


  const response =
    await fetch(
      url.toString(),
      {
        method:
          'GET',

        cache:
          'no-store'
      }
    );


  if (!response.ok) {

    throw new Error(
      'Server returned ' +
      response.status
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
   META
===================================================== */

async function loadMeta() {

  const data =
    await api(
      'meta'
    );


  state.meta =
    data;


  populateStops(
    data.stops
  );


  populateFilters(
    data.routes
  );
}


/* =====================================================
   STOPS
===================================================== */

function populateStops(
  stops
) {

  fromSelect.innerHTML =
    '<option value="">Select starting stop</option>';

  toSelect.innerHTML =
    '<option value="">Select destination</option>';


  stops.forEach(
    stop => {

      fromSelect.appendChild(
        createOption(
          stop,
          stop
        )
      );


      toSelect.appendChild(
        createOption(
          stop,
          stop
        )
      );
    }
  );
}


/* =====================================================
   FILTERS
===================================================== */

function populateFilters(
  routes
) {

  /*
   * BUS NUMBERS
   */

  const buses =
    uniqueSorted(
      routes.map(
        x => x.bus
      ).filter(Boolean)
    );


  busSelect.innerHTML =
    '<option value="">All bus routes</option>';


  buses.forEach(
    bus => {

      busSelect.appendChild(
        createOption(
          bus,
          bus
        )
      );
    }
  );


  /*
   * ROUTE NAMES
   */

  const routeNames =
    uniqueSorted(
      routes.map(
        x => x.route
      ).filter(Boolean)
    );


  routeSelect.innerHTML =
    '<option value="">All route names</option>';


  routeNames.forEach(
    route => {

      routeSelect.appendChild(
        createOption(
          route,
          route
        )
      );
    }
  );


  /*
   * VEHICLES
   */

  const vehicles =
    uniqueSorted(
      routes.map(
        x => x.vehicle
      ).filter(Boolean)
    );


  vehicleSelect.innerHTML =
    '<option value="">All vehicles</option>';


  vehicles.forEach(
    vehicle => {

      vehicleSelect.appendChild(
        createOption(
          vehicle,
          vehicle
        )
      );
    }
  );
}


/* =====================================================
   SEARCH
===================================================== */

async function searchBuses() {

  if (
    state.loading
  ) {

    return;
  }


  const from =
    fromSelect.value;

  const to =
    toSelect.value;

  const bus =
    busSelect.value;

  const route =
    routeSelect.value;

  const vehicle =
    vehicleSelect.value;

  const q =
    quickSearch.value.trim();


  /*
   * If absolutely no filter is
   * selected, show a helpful message
   * instead of downloading all
   * timetable rows.
   */

  if (
    !from &&
    !to &&
    !bus &&
    !route &&
    !vehicle &&
    !q
  ) {

    showEmpty(
      'Choose a route, route name, vehicle or From/To stops.'
    );

    return;
  }


  setLoading(
    true
  );


  try {

    const data =
      await api(
        'search',
        {
          from:
            from,

          to:
            to,

          bus:
            bus,

          route:
            route,

          vehicle:
            vehicle,

          q:
            q
        }
      );


    state.results =
      data.results || [];


    state.lastSearch =
      data;


    renderResults(
      state.results
    );


  } catch (error) {

    console.error(
      error
    );


    showError(
      error.message
    );


  } finally {

    setLoading(
      false
    );
  }
}


/* =====================================================
   RENDER RESULTS
===================================================== */

function renderResults(
  results
) {

  busResults.innerHTML =
    '';


  resultCount.textContent =
    results.length;


  if (
    !results.length
  ) {

    showEmpty(
      'No scheduled bus service matches the selected criteria.'
    );


    resultsSummary.textContent =
      'No matching services found.';


    return;
  }


  emptyState.classList.add(
    'hidden'
  );


  resultsSummary.textContent =
    buildSummary(
      results.length
    );


  results.forEach(
    (bus, index) => {

      const card =
        createBusCard(
          bus,
          index
        );


      busResults.appendChild(
        card
      );
    }
  );


  /*
   * Calculate initial bus positions.
   */

  updateAllBuses();
}


/* =====================================================
   CARD
===================================================== */

function createBusCard(
  bus,
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


  const timeline =
    compressTimeline(
      bus.timeline
    );


  const stateInfo =
    getBusState(
      timeline
    );


  if (
    stateInfo.running
  ) {

    card.classList.add(
      'live'
    );
  }


  card.innerHTML = `

    <div class="bus-card-header">

      <div>

        <div class="bus-number">
          ${escapeHtml(
            bus.bus || 'Bus'
          )}
        </div>

        <div class="bus-route-name">
          ${escapeHtml(
            bus.route ||
            'Route information unavailable'
          )}
        </div>

      </div>


      ${
        bus.vehicle
          ? `
            <div class="vehicle">
              ${escapeHtml(
                bus.vehicle
              )}
            </div>
          `
          : ''
      }

    </div>


    <div class="bus-status">

      <span class="status-text">
        ${stateInfo.message}
      </span>

    </div>


    <div class="timeline">

      <div class="timeline-line"></div>

      <div class="timeline-progress"></div>

      <div class="moving-bus">
        🚌
      </div>


      ${timeline
        .map(
          (point, i) => {

            const first =
              i === 0
                ? ' first'
                : '';

            const last =
              i ===
              timeline.length - 1
                ? ' last'
                : '';


            return `

              <div
                class="timeline-stop${first}${last}"
                data-index="${i}"
              >

                <div class="stop-dot"></div>

                <div class="stop-info">

                  <span class="stop-name">
                    ${escapeHtml(
                      point.stop
                    )}
                  </span>

                  <span class="stop-time">
                    ${escapeHtml(
                      point.time12 ||
                      formatMinutes(
                        point.minutes
                      )
                    )}
                  </span>

                </div>

              </div>

            `;
          }
        )
        .join('')}

    </div>


    <div class="next-stop">

      <span>
        Next Stop
      </span>

      <strong>
        ${escapeHtml(
          stateInfo.nextStop ||
          '—'
        )}
      </strong>

    </div>

  `;


  return card;
}


/* =====================================================
   COMPRESS TIMELINE
===================================================== */

function compressTimeline(
  timeline
) {

  const result = [];


  if (
    !timeline ||
    !timeline.length
  ) {

    return result;
  }


  timeline.forEach(
    point => {

      const stop =
        String(
          point.stop || ''
        ).trim();


      if (!stop) {
        return;
      }


      const last =
        result[
          result.length - 1
        ];


      if (
        last &&
        normalize(
          last.stop
        ) ===
        normalize(
          stop
        )
      ) {

        last.endMinutes =
          point.minutes;

        last.endTime12 =
          point.time12;

      } else {

        result.push({

          stop:
            stop,

          minutes:
            Number(
              point.minutes
            ),

          time12:
            point.time12,

          endMinutes:
            Number(
              point.minutes
            ),

          endTime12:
            point.time12
        });
      }
    }
  );


  return result;
}


/* =====================================================
   BUS STATE
===================================================== */

function getBusState(
  timeline
) {

  if (
    !timeline.length
  ) {

    return {

      running: false,

      message:
        'No timetable available',

      nextStop:
        ''
    };
  }


  const now =
    getCurrentMinutes();


  /*
   * Before first stop.
   */

  if (
    now <
    timeline[0].minutes
  ) {

    const diff =
      timeline[0].minutes -
      now;


    return {

      running: false,

      message:
        `<strong>Upcoming</strong> • Starts in ${formatRelative(diff)}`,

      nextStop:
        timeline[0].stop
    };
  }


  /*
   * Find current segment.
   */

  for (
    let i = 0;
    i < timeline.length - 1;
    i++
  ) {

    const current =
      timeline[i];

    const next =
      timeline[i + 1];


    if (
      now >= current.minutes &&
      now <
      next.minutes
    ) {

      const remaining =
        next.minutes -
        now;


      if (
        remaining <= 1
      ) {

        return {

          running: true,

          message:
            `<strong>Arriving now</strong> • ${escapeHtml(next.stop)}`,

          nextStop:
            next.stop
        };
      }


      return {

        running: true,

        message:
          `<strong>In service</strong> • Next stop in ${formatRelative(remaining)}`,

        nextStop:
          next.stop
      };
    }
  }


  /*
   * Completed.
   */

  return {

    running: false,

    message:
      '<strong>Service completed</strong> for the current timetable',

    nextStop:
      '—'
  };
}


/* =====================================================
   UPDATE ALL BUS POSITIONS
===================================================== */

function updateAllBuses() {

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
        state.results[index];


      if (!bus) {
        return;
      }


      updateBusPosition(
        card,
        bus
      );
    }
  );
}


/* =====================================================
   MOVE BUS
===================================================== */

function updateBusPosition(
  card,
  bus
) {

  const timeline =
    compressTimeline(
      bus.timeline
    );


  if (
    !timeline.length
  ) {

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


  const status =
    card.querySelector(
      '.status-text'
    );


  const nextStop =
    card.querySelector(
      '.next-stop strong'
    );


  const now =
    getCurrentMinutes();


  let position =
    0;


  /*
   * Before start.
   */

  if (
    now <
    timeline[0].minutes
  ) {

    position =
      0;

  } else {

    /*
     * After final stop.
     */

    if (
      now >=
      timeline[
        timeline.length - 1
      ].minutes
    ) {

      position =
        timeline.length - 1;

    } else {

      for (
        let i = 0;
        i <
        timeline.length - 1;
        i++
      ) {

        const current =
          timeline[i];

        const next =
          timeline[i + 1];


        if (
          now >=
          current.minutes &&
          now <
          next.minutes
        ) {

          const duration =
            next.minutes -
            current.minutes;


          const elapsed =
            now -
            current.minutes;


          const fraction =
            duration > 0
              ? elapsed / duration
              : 0;


          position =
            i + fraction;


          break;
        }
      }
    }
  }


  const lower =
    Math.floor(
      position
    );


  const upper =
    Math.min(
      lower + 1,
      stops.length - 1
    );


  const fraction =
    position - lower;


  const lowerStop =
    stops[lower];


  const upperStop =
    stops[upper];


  if (!lowerStop) {
    return;
  }


  const lowerY =
    lowerStop.offsetTop +
    lowerStop.offsetHeight / 2;


  const upperY =
    upperStop
      ? upperStop.offsetTop +
        upperStop.offsetHeight / 2
      : lowerY;


  const y =
    lowerY +
    (
      upperY -
      lowerY
    ) *
    fraction;


  movingBus.style.transform =
    `translateY(${y - 22}px)`;


  /*
   * Progress.
   */

  const first =
    stops[0];

  const last =
    stops[
      stops.length - 1
    ];


  if (
    first &&
    last
  ) {

    const start =
      first.offsetTop +
      first.offsetHeight / 2;


    const end =
      last.offsetTop +
      last.offsetHeight / 2;


    const percent =
      end > start
        ? (
            (y - start) /
            (end - start)
          ) * 100
        : 0;


    progress.style.height =
      `${Math.max(
        0,
        Math.min(
          100,
          percent
        )
      )}%`;
  }


  /*
   * Status.
   */

  const info =
    getBusState(
      timeline
    );


  status.innerHTML =
    info.message;


  nextStop.textContent =
    info.nextStop || '—';


  if (
    info.running
  ) {

    card.classList.add(
      'live'
    );

  } else {

    card.classList.remove(
      'live'
    );
  }
}


/* =====================================================
   CLOCK
===================================================== */

function updateClock() {

  const now =
    new Date();


  currentTime.textContent =
    now.toLocaleTimeString(
      'en-IN',
      {
        hour:
          '2-digit',

        minute:
          '2-digit',

        second:
          '2-digit',

        hour12:
          true
      }
    );


  currentDate.textContent =
    now.toLocaleDateString(
      'en-IN',
      {
        weekday:
          'long',

        day:
          '2-digit',

        month:
          'short',

        year:
          'numeric'
      }
    );


  /*
   * This is entirely browser-side.
   *
   * No Google Sheet request.
   */

  updateAllBuses();
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
   FORMAT TIME
===================================================== */

function formatMinutes(
  minutes
) {

  let value =
    Math.floor(
      minutes
    );


  value =
    (
      value % 1440 +
      1440
    ) % 1440;


  let hour =
    Math.floor(
      value / 60
    );


  const minute =
    value % 60;


  const suffix =
    hour >= 12
      ? 'PM'
      : 'AM';


  hour =
    hour % 12;


  if (
    hour === 0
  ) {
    hour = 12;
  }


  return (
    String(hour)
      .padStart(2, '0') +
    ':' +
    String(minute)
      .padStart(2, '0') +
    ' ' +
    suffix
  );
}


/* =====================================================
   RELATIVE TIME
===================================================== */

function formatRelative(
  minutes
) {

  const value =
    Math.max(
      0,
      Math.round(
        minutes
      )
    );


  if (
    value <= 0
  ) {

    return 'now';
  }


  if (
    value === 1
  ) {

    return '1 min';
  }


  return (
    value +
    ' mins'
  );
}


/* =====================================================
   RESET
===================================================== */

function resetAll() {

  quickSearch.value =
    '';

  fromSelect.value =
    '';

  toSelect.value =
    '';

  busSelect.value =
    '';

  routeSelect.value =
    '';

  vehicleSelect.value =
    '';


  state.results =
    [];


  busResults.innerHTML =
    '';


  resultCount.textContent =
    '0';


  resultsSummary.textContent =
    'Select your journey to find available buses.';


  showEmpty(
    'Select From and To stops, or search by route, route name or vehicle number.'
  );
}


/* =====================================================
   SWAP
===================================================== */

function swapStops() {

  const from =
    fromSelect.value;

  const to =
    toSelect.value;


  fromSelect.value =
    to;

  toSelect.value =
    from;


  if (
    from ||
    to
  ) {

    searchBuses();
  }
}


/* =====================================================
   REFRESH
===================================================== */

async function refreshData() {

  refreshButton.disabled =
    true;


  refreshButton.textContent =
    'Refreshing...';


  try {

    /*
     * Refresh server cache.
     */

    await api(
      'refresh'
    );


    /*
     * Reload metadata.
     */

    await loadMeta();


    setConnection(
      true
    );


    if (
      state.lastSearch
    ) {

      await searchBuses();
    }


  } catch (error) {

    console.error(
      error
    );


    setConnection(
      false
    );

  } finally {

    refreshButton.disabled =
      false;

    refreshButton.textContent =
      '↻ Refresh';
  }
}


/* =====================================================
   LOADING
===================================================== */

function setLoading(
  value
) {

  state.loading =
    value;


  if (value) {

    loadingState.classList.remove(
      'hidden'
    );

    emptyState.classList.add(
      'hidden'
    );

    busResults.innerHTML =
      '';

  } else {

    loadingState.classList.add(
      'hidden'
    );
  }
}


/* =====================================================
   EMPTY
===================================================== */

function showEmpty(
  message
) {

  busResults.innerHTML =
    '';


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
      ${escapeHtml(message)}
    </p>

  `;
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


  busResults.innerHTML =
    '';


  emptyState.innerHTML = `

    <div class="empty-icon">
      ⚠️
    </div>

    <h3>
      Service temporarily unavailable
    </h3>

    <p>
      ${escapeHtml(message)}
    </p>

  `;
}


/* =====================================================
   CONNECTION
===================================================== */

function setConnection(
  online
) {

  if (online) {

    connectionDot.className =
      'connection-dot online';

    connectionText.textContent =
      'Online';

  } else {

    connectionDot.className =
      'connection-dot offline';

    connectionText.textContent =
      'Unavailable';
  }
}


/* =====================================================
   CREATE OPTION
===================================================== */

function createOption(
  value,
  label
) {

  const option =
    document.createElement(
      'option'
    );


  option.value =
    value;


  option.textContent =
    label;


  return option;
}


/* =====================================================
   UNIQUE SORT
===================================================== */

function uniqueSorted(
  values
) {

  const map =
    new Map();


  values.forEach(
    value => {

      const text =
        String(
          value || ''
        ).trim();


      if (!text) {
        return;
      }


      map.set(
        normalize(text),
        text
      );
    }
  );


  return Array.from(
    map.values()
  ).sort(
    naturalCompare
  );
}


/* =====================================================
   NORMALIZE
===================================================== */

function normalize(
  value
) {

  return String(
    value || ''
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .toUpperCase();
}


/* =====================================================
   SORT
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
        numeric:
          true,

        sensitivity:
          'base'
      }
    );
}


/* =====================================================
   SUMMARY
===================================================== */

function buildSummary(
  count
) {

  const parts = [];


  if (
    fromSelect.value
  ) {

    parts.push(
      'From ' +
      fromSelect.value
    );
  }


  if (
    toSelect.value
  ) {

    parts.push(
      'To ' +
      toSelect.value
    );
  }


  if (
    busSelect.value
  ) {

    parts.push(
      'Route ' +
      busSelect.value
    );
  }


  if (
    routeSelect.value
  ) {

    parts.push(
      routeSelect.value
    );
  }


  const base =
    count +
    ' service' +
    (
      count === 1
        ? ''
        : 's'
    ) +
    ' found';


  if (
    parts.length
  ) {

    return (
      base +
      ' • ' +
      parts.join(
        ' • '
      )
    );
  }


  return base;
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
  value
) {

  return String(
    value ?? ''
  )
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
