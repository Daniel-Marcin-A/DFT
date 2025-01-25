/*******************************
 * Zmienne globalne
 *******************************/
let signalChartInstance = null; // wykres sygnału
let dftBarChartInstance = null; // wykres słupkowy widma

// Tablica obiektów składowych: {freq, amp, phase}
let signalComponents = [];

// Podstawowe parametry
let samplingRate = 300;
let numberOfSamples = 6;
let timeStep;

// Tablice z próbkami
const arrayOfSamples = [];
const continuousSignal = [];

// DFT: tablica wynikowa, tablice real/imag
let dftResults = [];
let arrayOfRealComponents = [];
let arrayOfImagComponents = [];

// Tablica przechowująca opisy pośrednich wyników (analogicznie do starego kodu)
let dftIntermediate = [];

/*******************************
 * 1. Generowanie inputów dla składowych
 *******************************/
function createComponentsInputs() {
  const container = document.getElementById('componentsContainer');
  container.innerHTML = '';

  const num = parseInt(document.getElementById('numComponents').value, 10);
  if (num < 1 || num > 10) return;

  for (let i = 1; i <= num; i++) {
    const div = document.createElement('div');
    div.style.border = '1px solid #ccc';
    div.style.padding = '8px';
    div.style.margin = '8px 0';

    const header = document.createElement('h5');
    header.textContent = `Parametry składowej nr ${i}`;
    div.appendChild(header);

    // freq
    const freqLabel = document.createElement('label');
    freqLabel.textContent = 'Częstotliwość [Hz]: ';
    const freqInput = document.createElement('input');
    freqInput.type = 'number';
    freqInput.id = `freq${i}`;
    freqInput.value = i === 1 ? '50' : '0';
    freqInput.step = '0.001';

    // amp
    const ampLabel = document.createElement('label');
    ampLabel.textContent = ' Amplituda: ';
    const ampInput = document.createElement('input');
    ampInput.type = 'number';
    ampInput.id = `amp${i}`;
    ampInput.value = i === 1 ? '2' : '0';
    ampInput.step = '0.001';

    // phase
    const phaseLabel = document.createElement('label');
    phaseLabel.textContent = ' Faza (wielokrotność π): ';
    const phaseInput = document.createElement('input');
    phaseInput.type = 'number';
    phaseInput.id = `phase${i}`;
    phaseInput.value = i === 1 ? '0' : '0';
    phaseInput.step = '0.001';

    div.appendChild(freqLabel);
    div.appendChild(freqInput);
    div.appendChild(ampLabel);
    div.appendChild(ampInput);
    div.appendChild(phaseLabel);
    div.appendChild(phaseInput);

    container.appendChild(div);
  }
}

/*******************************
 * 2. Odczytywanie składowych
 *******************************/
function readSignalComponents() {
  signalComponents = [];
  const num = parseInt(document.getElementById('numComponents').value, 10);

  for (let i = 1; i <= num; i++) {
    const freqInput = document.getElementById(`freq${i}`);
    const ampInput = document.getElementById(`amp${i}`);
    const phaseInput = document.getElementById(`phase${i}`);
    if (freqInput && ampInput && phaseInput) {
      const freq = parseFloat(freqInput.value);
      const amp = parseFloat(ampInput.value);
      const phase = parseFloat(phaseInput.value) * Math.PI;
      signalComponents.push({ freq, amp, phase });
    }
  }
}

/*******************************
 * 3. Generowanie sygnału ciągłego
 *******************************/
function generateContinuousSignal() {
  continuousSignal.length = 0;

  for (let n = 0; n < numberOfSamples; n += 0.02) {
    let x = n / samplingRate;
    let y = 0;
    for (const comp of signalComponents) {
      y += comp.amp * Math.sin(2 * Math.PI * comp.freq * x + comp.phase);
    }
    continuousSignal.push({ x, y });
  }
}

/*******************************
 * 4. Generowanie próbek (do DFT)
 *******************************/
function sampling() {
  arrayOfSamples.length = 0;
  for (let n = 0; n < numberOfSamples; n++) {
    let x = n / samplingRate;
    let y = 0;
    for (const comp of signalComponents) {
      y += comp.amp * Math.sin(2 * Math.PI * comp.freq * x + comp.phase);
    }
    arrayOfSamples.push({ x, y });
  }
}

/*******************************
 * 5. Funkcja licząca DFT + zapisywanie wyników pośrednich
 *******************************/
function dftCompute() {
  dftResults = [];
  arrayOfRealComponents = [];
  arrayOfImagComponents = [];
  dftIntermediate = []; // przechowuje opisy pośrednich wyników

  // Inicjujemy
  for (let m = 0; m < numberOfSamples; m++) {
    let realSum = 0;
    let imagSum = 0;
    // tablica stringów do wyników pośrednich dla prążka m
    let partialStrings = [];

    for (let n = 0; n < numberOfSamples; n++) {
      // Znak minus w wykładniku: e^{-j 2 pi m n / N}
      // => real = cos(+phase), imag = -sin(+phase)
      let phaseValue = (2 * Math.PI * m * n) / numberOfSamples;

      let rePart = arrayOfSamples[n].y * Math.cos(phaseValue);
      let imPart = -arrayOfSamples[n].y * Math.sin(phaseValue);

      realSum += rePart;
      imagSum += imPart;

      // Zbuduj tekst do "wyników pośrednich"
      let freq = (m * samplingRate) / numberOfSamples;
      let partialStr =
        `DFT(m=${m}, n=${n}), freq=${freq.toFixed(2)}Hz:` +
        ` rePart=${rePart.toFixed(4)}, imPart=${imPart.toFixed(4)}`;
      partialStrings.push(partialStr);
    }

    arrayOfRealComponents.push(realSum);
    arrayOfImagComponents.push(imagSum);

    let complexVal = math.complex(realSum, imagSum);
    dftResults.push(complexVal);

    // Zapisz te wyniki pośrednie
    dftIntermediate.push(partialStrings);
  }
}

/*******************************
 * 6. Wyświetlanie próbek
 *******************************/
function displaySamples() {
  let resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = ''; // czyścimy

  let samplesSection = document.createElement('section');
  let data = document.createElement('ul');
  let title = document.createElement('h4');
  title.textContent = 'Próbki sygnału';

  arrayOfSamples.forEach((s, i) => {
    let li = document.createElement('li');
    li.textContent = `n=${i},  y=${s.y.toFixed(4)}`;
    data.appendChild(li);
  });

  samplesSection.appendChild(title);
  samplesSection.appendChild(data);
  resultsDiv.appendChild(samplesSection);
}

/*******************************
 * 7. Wyświetlanie pośrednich wyników DFT
 *******************************/
function displayPartialDFTResults() {
  let resultsDiv = document.getElementById('results');

  // Stworzymy nową sekcję
  let partialSection = document.createElement('section');
  let title = document.createElement('h4');
  title.textContent = 'Wyniki pośrednie (DFT)';
  partialSection.appendChild(title);

  // dftIntermediate[m] to tablica stringów dla prążka m
  for (let m = 0; m < numberOfSamples; m++) {
    // Nagłówek "Prążek m"
    let subTitle = document.createElement('h5');
    subTitle.textContent = `Prążek m=${m}`;
    partialSection.appendChild(subTitle);

    let ul = document.createElement('ul');
    dftIntermediate[m].forEach((str) => {
      let li = document.createElement('li');
      li.textContent = str;
      ul.appendChild(li);
    });
    partialSection.appendChild(ul);
  }

  resultsDiv.appendChild(partialSection);
}

/*******************************
 * 8. Wyświetlanie końcowych wyników DFT
 *******************************/
function displayDFTResults() {
  const DFTresultsDiv = document.getElementById('DFTresults');
  DFTresultsDiv.innerHTML = '';

  let section = document.createElement('section');
  let title = document.createElement('h4');
  title.textContent = 'Końcowe wyniki DFT';
  section.appendChild(title);

  for (let m = 0; m < numberOfSamples; m++) {
    let freq = (m * samplingRate) / numberOfSamples;
    let reVal = arrayOfRealComponents[m];
    let imVal = arrayOfImagComponents[m];
    let compVal = math.complex(reVal, imVal);
    const compStr = math.format(compVal, { notation: 'fixed', precision: 4 });

    let li = document.createElement('li');
    li.textContent = `m=${m}, f=${freq.toFixed(2)}Hz, X[m]=${compStr}`;
    section.appendChild(li);
  }

  DFTresultsDiv.appendChild(section);
}

/*******************************
 * 9. Wykres sygnału
 *******************************/
function generateSignalAndSamplesChart() {
  const ctx = document.getElementById('SignalAndSamples').getContext('2d');
  if (signalChartInstance) {
    signalChartInstance.destroy();
  }

  signalChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Signal',
          data: continuousSignal,
          borderColor: 'rgba(75, 192, 192, 1)',
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Samples',
          data: arrayOfSamples,
          borderColor: 'rgb(219, 56, 27)',
          type: 'scatter',
          showLine: false,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Time (s)' },
        },
        y: {
          title: { display: true, text: 'Amplitude' },
        },
      },
    },
  });
}

/*******************************
 * 10. Wykres słupkowy widma (procentowa zawartość)
 *******************************/
function showDFTBarChart() {
  const amplitudes = dftResults.map((val) => math.abs(val));
  const maxAmp = Math.max(...amplitudes);
  const percentages = amplitudes.map((a) => (a / maxAmp) * 100);

  const labels = dftResults.map((_, m) => {
    let freq = (m * samplingRate) / numberOfSamples;
    return freq.toFixed(2) + ' Hz';
  });

  const ctx = document.getElementById('DFTBarChart').getContext('2d');
  if (dftBarChartInstance) {
    dftBarChartInstance.destroy();
  }

  dftBarChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Procentowa zawartość (%)',
          data: percentages,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Częstotliwość [Hz]' },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Zawartość procentowa [%]' },
        },
      },
    },
  });
}

/*******************************
 * 11. GŁÓWNA FUNKCJA - wywołana z HTML
 *******************************/
function DFTAlgorithm() {
  // 1. Pobierz liczbę składowych, wczytaj składowe
  readSignalComponents();

  // 2. Pobierz samplingRate i numberOfSamples
  samplingRate = parseFloat(document.getElementById('samplingRate').value);
  numberOfSamples = parseInt(
    document.getElementById('numberOfSamples').value,
    10
  );

  // 3. Generowanie sygnału i próbek
  timeStep = 1 / samplingRate;
  generateContinuousSignal();
  sampling();

  // 4. Wyświetlenie próbek
  displaySamples();

  // 5. Rysowanie wykresu sygnału
  generateSignalAndSamplesChart();

  // 6. Policzenie DFT (z wynikami pośrednimi)
  dftCompute();

  // 7. Wyświetlenie wyników pośrednich
  displayPartialDFTResults();

  // 8. Wyświetlenie wyników końcowych
  displayDFTResults();

  // 9. Rysunek słupkowy DFT
  showDFTBarChart();
}
