// Pro Dart Manager — data: rigtige spillere (vurderinger er skøn), nationer, turneringer
(function (G) {
  'use strict';
  const NATIONS = {
    ENG: { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, NED: { name: 'Holland', flag: '🇳🇱' }, WAL: { name: 'Wales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
    SCO: { name: 'Skotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' }, NIR: { name: 'Nordirland', flag: '🇬🇧' }, IRL: { name: 'Irland', flag: '🇮🇪' },
    BEL: { name: 'Belgien', flag: '🇧🇪' }, GER: { name: 'Tyskland', flag: '🇩🇪' }, AUT: { name: 'Østrig', flag: '🇦🇹' },
    AUS: { name: 'Australien', flag: '🇦🇺' }, POL: { name: 'Polen', flag: '🇵🇱' }, POR: { name: 'Portugal', flag: '🇵🇹' },
    DEN: { name: 'Danmark', flag: '🇩🇰' }, SWE: { name: 'Sverige', flag: '🇸🇪' }, LAT: { name: 'Letland', flag: '🇱🇻' },
    LTU: { name: 'Litauen', flag: '🇱🇹' }, CZE: { name: 'Tjekkiet', flag: '🇨🇿' }, FRA: { name: 'Frankrig', flag: '🇫🇷' },
    SUI: { name: 'Schweiz', flag: '🇨🇭' }, USA: { name: 'USA', flag: '🇺🇸' }, CAN: { name: 'Canada', flag: '🇨🇦' },
    JPN: { name: 'Japan', flag: '🇯🇵' }, PHI: { name: 'Filippinerne', flag: '🇵🇭' }, NZL: { name: 'New Zealand', flag: '🇳🇿' },
    ESP: { name: 'Spanien', flag: '🇪🇸' }, NOR: { name: 'Norge', flag: '🇳🇴' }, FIN: { name: 'Finland', flag: '🇫🇮' },
    HUN: { name: 'Ungarn', flag: '🇭🇺' }, ITA: { name: 'Italien', flag: '🇮🇹' }, RSA: { name: 'Sydafrika', flag: '🇿🇦' },
  };

  // [navn, kælenavn, nation, fødselsår, scoring, doubler, stabilitet, nerver, udholdenhed]
  // Rækkefølgen er cirka-ranglisten ved spillets start. Vurderingerne er skøn, ikke officielle tal.
  const REAL = [
    ['Luke Littler', 'The Nuke', 'ENG', 2007, 95, 90, 88, 94, 90],
    ['Luke Humphries', 'Cool Hand Luke', 'ENG', 1995, 92, 89, 89, 91, 90],
    ['Michael van Gerwen', 'Mighty Mike', 'NED', 1989, 90, 87, 82, 90, 86],
    ['Gerwyn Price', 'The Iceman', 'WAL', 1985, 89, 87, 84, 88, 88],
    ['Stephen Bunting', 'The Bullet', 'ENG', 1985, 88, 86, 85, 84, 85],
    ['Gian van Veen', 'The Giant', 'NED', 2002, 89, 86, 83, 85, 88],
    ['Rob Cross', 'Voltage', 'ENG', 1990, 87, 86, 82, 86, 84],
    ['Jonny Clayton', 'The Ferret', 'WAL', 1974, 87, 86, 84, 85, 82],
    ['Michael Smith', 'Bully Boy', 'ENG', 1990, 88, 82, 78, 84, 84],
    ['Danny Noppert', 'The Freeze', 'NED', 1990, 86, 86, 86, 82, 84],
    ['Nathan Aspinall', 'The Asp', 'ENG', 1991, 87, 85, 80, 86, 83],
    ['Josh Rock', 'Rocky', 'NIR', 2001, 89, 83, 79, 82, 86],
    ['Chris Dobey', 'Hollywood', 'ENG', 1990, 87, 84, 81, 82, 84],
    ['Damon Heta', 'The Heat', 'AUS', 1987, 86, 84, 82, 82, 85],
    ['James Wade', 'The Machine', 'ENG', 1983, 84, 87, 86, 86, 80],
    ['Peter Wright', 'Snakebite', 'SCO', 1970, 85, 85, 77, 85, 78],
    ['Martin Schindler', 'The Wall', 'GER', 1996, 86, 84, 83, 80, 85],
    ['Ross Smith', 'Smudger', 'ENG', 1989, 86, 82, 79, 81, 83],
    ['Dave Chisnall', 'Chizzy', 'ENG', 1980, 87, 81, 78, 79, 82],
    ['Ryan Searle', 'Heavy Metal', 'ENG', 1987, 86, 83, 80, 81, 84],
    ['Mike De Decker', 'The Real Deal', 'BEL', 1995, 85, 84, 82, 83, 84],
    ['Dirk van Duijvenbode', 'Aubergenius', 'NED', 1992, 86, 83, 76, 80, 82],
    ['Joe Cullen', 'The Rockstar', 'ENG', 1989, 85, 84, 80, 80, 83],
    ['Dimitri Van den Bergh', 'The DreamMaker', 'BEL', 1994, 85, 84, 80, 82, 84],
    ['Gary Anderson', 'The Flying Scotsman', 'SCO', 1970, 87, 83, 78, 84, 76],
    ['Wessel Nijman', 'The Rumble', 'NED', 2000, 86, 83, 80, 80, 86],
    ['Ricardo Pietreczko', 'Pikachu', 'GER', 1994, 84, 84, 80, 80, 84],
    ['Cameron Menzies', 'Cammy', 'SCO', 1989, 85, 82, 76, 79, 82],
    ['Daryl Gurney', 'Superchin', 'NIR', 1986, 84, 83, 79, 81, 82],
    ['Andrew Gilding', 'Goldfinger', 'ENG', 1970, 83, 84, 82, 82, 78],
    ['Ritchie Edhouse', 'The Prince', 'ENG', 1983, 84, 83, 80, 79, 82],
    ['Luke Woodhouse', 'Woody', 'ENG', 1988, 84, 82, 80, 78, 82],
    ['Gabriel Clemens', 'The German Giant', 'GER', 1983, 83, 83, 80, 80, 82],
    ['Krzysztof Ratajski', 'The Polish Eagle', 'POL', 1977, 84, 83, 82, 79, 80],
    ['Kevin Doets', 'Doetsy', 'NED', 1998, 84, 82, 80, 78, 84],
    ['Jermaine Wattimena', 'The Machine Gun', 'NED', 1988, 84, 81, 78, 78, 82],
    ['Raymond van Barneveld', 'Barney', 'NED', 1967, 83, 82, 77, 82, 76],
    ['Niels Zonneveld', 'No Mercy', 'NED', 1998, 83, 82, 80, 78, 83],
    ['Dylan Slevin', 'Dyl the Thrill', 'IRL', 2002, 83, 82, 78, 79, 84],
    ['Mensur Suljović', 'The Gentle', 'AUT', 1972, 82, 83, 83, 80, 76],
    ['Brendan Dolan', 'The History Maker', 'NIR', 1973, 82, 83, 80, 82, 78],
    ['Callan Rydz', 'The Riot', 'ENG', 1998, 84, 80, 76, 77, 83],
    ['Jose de Sousa', 'The Special One', 'POR', 1974, 84, 80, 74, 79, 78],
    ['Martin Lukeman', 'Smashing', 'ENG', 1985, 83, 81, 79, 77, 82],
    ['Madars Razma', 'The Latvian Lightning', 'LAT', 1988, 83, 82, 79, 79, 82],
    ['Josh Payne', 'The Real Deal', 'ENG', 1990, 83, 81, 78, 77, 82],
    ['Ryan Joyce', 'Relentless', 'ENG', 1985, 82, 82, 80, 78, 82],
    ['Ian White', 'Diamond', 'ENG', 1970, 82, 81, 80, 78, 76],
    ['Mickey Mansell', 'Clockwork', 'NIR', 1973, 81, 82, 80, 79, 76],
    ['Karel Sedláček', 'Kaja', 'CZE', 1979, 82, 81, 77, 77, 78],
    ['Rob Owen', 'The Ultimate Warrior', 'WAL', 1984, 82, 80, 77, 77, 80],
    ['Jeffrey de Graaf', 'The Hurricane', 'SWE', 1990, 82, 81, 78, 77, 80],
    ['Kim Huybrechts', 'The Hurricane', 'BEL', 1985, 83, 80, 75, 77, 80],
    ['Scott Williams', 'Scotty 2 Hotty', 'ENG', 1990, 83, 80, 75, 78, 81],
    ['Ricky Evans', 'Rapid', 'ENG', 1990, 82, 79, 74, 76, 80],
    ['Keane Barry', 'The Kid', 'IRL', 2002, 82, 81, 78, 78, 84],
    ['Niko Springer', 'The Lightning Kid', 'GER', 2000, 83, 81, 78, 78, 84],
    ['Jim Williams', 'Jimbo', 'WAL', 1984, 82, 81, 77, 77, 80],
    ['Danny van Trijp', 'The Tripster', 'NED', 1995, 82, 80, 78, 76, 82],
    ['Wesley Plaisier', 'The Wizard', 'NED', 1990, 82, 80, 78, 77, 81],
    ['Thibault Tricole', 'The Frenchie', 'FRA', 1990, 82, 80, 77, 77, 81],
    ['Dom Taylor', 'The Dominator', 'ENG', 1998, 82, 80, 77, 77, 82],
    ['Connor Scutt', 'The Scutty', 'ENG', 1997, 82, 79, 76, 76, 82],
    ['Ryan Meikle', 'Supernova', 'ENG', 1996, 81, 80, 76, 76, 82],
    ['William O\'Connor', 'The Magpie', 'IRL', 1986, 81, 81, 78, 77, 80],
    ['Jamie Hughes', 'Jabba', 'ENG', 1986, 81, 80, 77, 77, 80],
    ['Matt Campbell', 'Matty', 'CAN', 1990, 81, 80, 77, 76, 80],
    ['Steve Beaton', 'The Bronzed Adonis', 'ENG', 1964, 79, 81, 80, 80, 72],
    ['Florian Hempel', 'Jackpot', 'GER', 1990, 81, 79, 75, 75, 80],
    ['Daniel Klose', 'The Lightning', 'GER', 1990, 81, 79, 76, 75, 80],
    ['Benjamin Drue Reus', 'Bennie', 'DEN', 2000, 81, 79, 76, 76, 82],
    ['Vladimir Andersen', 'The Viking', 'DEN', 1991, 80, 79, 76, 75, 80],
    ['Darius Labanauskas', 'The Lithuanian Thunder', 'LTU', 1976, 80, 80, 77, 77, 76],
    ['Rowby-John Rodriguez', 'Little John', 'AUT', 1994, 81, 79, 74, 75, 80],
    ['Alan Soutar', 'Soots', 'SCO', 1978, 80, 80, 77, 77, 78],
    ['Danny Jansen', 'The Dutch Dragon', 'NED', 1998, 81, 79, 76, 75, 82],
    ['Cam Crabtree', 'The Crab', 'ENG', 2002, 81, 79, 75, 75, 82],
    ['Nick Kenny', 'The Kenny', 'WAL', 1993, 81, 79, 75, 75, 80],
    ['Lee Evans', 'The Eagle', 'ENG', 1992, 80, 79, 76, 75, 80],
    ['Stefan Bellmont', 'Stibi', 'SUI', 1994, 80, 79, 75, 75, 80],
    ['Leonard Gates', 'Big Sexy', 'USA', 1981, 80, 78, 74, 76, 76],
    ['Paolo Nebrida', 'The Pinoy', 'PHI', 1983, 79, 79, 75, 75, 76],
    ['Haupai Puha', 'The Kiwi', 'NZL', 1984, 79, 78, 74, 75, 78],
    ['Simon Whitlock', 'The Wizard', 'AUS', 1969, 79, 79, 76, 77, 72],
    ['Joe Comito', 'The Kid', 'AUS', 1989, 79, 78, 75, 74, 78],
    ['Mario Vandenbogaerde', 'Super Mario', 'BEL', 1993, 80, 78, 75, 74, 80],
    ['Kai Gotthardt', 'The Kaiser', 'GER', 1999, 80, 78, 75, 74, 82],
    ['Owen Bates', 'The Bates Motel', 'ENG', 2001, 80, 78, 75, 74, 82],
    ['Patrick Geeraets', 'Gerry', 'NED', 1990, 79, 78, 75, 74, 80],
    ['Bradley Brooks', 'The Bomber', 'ENG', 2000, 80, 78, 74, 74, 82],
    ['Adam Gawlas', 'The Czech Mate', 'CZE', 2003, 80, 78, 74, 74, 83],
    ['Sebastian Białecki', 'The Polish Prodigy', 'POL', 2003, 79, 78, 74, 74, 82],
    ['Andy Baetens', 'The Bandit', 'BEL', 1993, 79, 78, 75, 74, 80],
    ['Martijn Dragt', 'The Dragon', 'NED', 1997, 79, 77, 74, 73, 80],
    ['Andreas Hyllemose', 'Hylle', 'DEN', 1990, 76, 76, 73, 72, 78],
    ['Kevin Burness', 'The Burner', 'NIR', 1985, 79, 78, 75, 74, 78],
    ['Mervyn King', 'The King', 'ENG', 1966, 78, 79, 77, 76, 72],
    ['Raymond Smith', 'Smithy', 'AUS', 1985, 79, 77, 74, 74, 78],
    ['Ted Evetts', 'Ted Rocks', 'ENG', 1997, 79, 77, 74, 73, 80],
    ['Jack Main', 'The Main Man', 'ENG', 1998, 79, 77, 74, 73, 80],
    ['Max Hopp', 'The Maximiser', 'GER', 1996, 79, 77, 73, 73, 80],
    ['Jules van Dongen', 'The Rhino', 'USA', 1990, 79, 77, 74, 73, 80],
    ['Christian Kist', 'The Wolf', 'NED', 1986, 78, 77, 74, 73, 78],
    ['Mike van Duivenbode', 'Spider Mike', 'NED', 1993, 78, 77, 74, 73, 80],
    ['Jeffrey Sparidaans', 'The Dutch Destroyer', 'NED', 1998, 79, 77, 73, 73, 80],
    ['Tomoya Goto', 'The Fly', 'JPN', 1990, 78, 77, 74, 73, 78],
  ];

  // Navnelister til fiktive spillere
  const FIRST = {
    ENG: ['Jack', 'Harry', 'Tom', 'Callum', 'Liam', 'Kyle', 'Jordan', 'Lewis', 'Ben', 'Sam', 'Danny', 'Jamie', 'Connor', 'Reece', 'Owen', 'Ashley', 'Craig', 'Gary', 'Lee', 'Wayne'],
    NED: ['Jeroen', 'Sven', 'Ruud', 'Niels', 'Bram', 'Thijs', 'Sander', 'Jelle', 'Rick', 'Stijn'],
    GER: ['Lukas', 'Jonas', 'Florian', 'Kevin', 'Tobias', 'Dennis', 'Marcel', 'Sven', 'Nico', 'Patrick'],
    DEN: ['Mikkel', 'Rasmus', 'Kasper', 'Jonas', 'Frederik', 'Mads', 'Nikolaj', 'Emil', 'Simon', 'Anders'],
    BEL: ['Jens', 'Pieter', 'Kenny', 'Brecht', 'Wout', 'Dries'],
    SCO: ['Ross', 'Euan', 'Calum', 'Fraser', 'Scott', 'Gregor'],
    WAL: ['Rhys', 'Dafydd', 'Gethin', 'Owain', 'Lewis'],
    IRL: ['Sean', 'Ciaran', 'Darragh', 'Eoin', 'Niall'],
    AUS: ['Brody', 'Mitch', 'Kane', 'Lachlan', 'Tyson'],
    POL: ['Kamil', 'Pawel', 'Tomasz', 'Mateusz'],
    SWE: ['Oskar', 'Viktor', 'Johan', 'Erik'],
    USA: ['Tyler', 'Cody', 'Brandon', 'Chase'],
    AUT: ['Florian', 'Lukas', 'Mario'],
    CZE: ['Jakub', 'Ondřej', 'Petr'],
  };
  const LAST = {
    ENG: ['Walker', 'Harris', 'Bennett', 'Hughes', 'Clarke', 'Turner', 'Price', 'Fletcher', 'Mason', 'Barker', 'Holt', 'Marsh', 'Dawson', 'Riley', 'Shaw', 'Webb', 'Pearce', 'Lowe', 'Booth', 'Kemp'],
    NED: ['de Vries', 'Bakker', 'Visser', 'Smit', 'Mulder', 'de Boer', 'Bos', 'Vos', 'Peters', 'Hendriks'],
    GER: ['Müller', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Koch', 'Richter', 'Wolf'],
    DEN: ['Nielsen', 'Jensen', 'Hansen', 'Pedersen', 'Kristensen', 'Larsen', 'Madsen', 'Rasmussen', 'Thomsen', 'Kjær'],
    BEL: ['Peeters', 'Janssens', 'Maes', 'Claes', 'Wouters', 'Goossens'],
    SCO: ['McLeod', 'Fraser', 'Campbell', 'Stewart', 'Murray', 'Reid'],
    WAL: ['Jones', 'Evans', 'Morgan', 'Davies', 'Griffiths'],
    IRL: ['Murphy', 'Kelly', 'Byrne', 'Walsh', 'Doyle'],
    AUS: ['Mitchell', 'Brennan', 'Cooper', 'Kelly', 'Ward'],
    POL: ['Nowak', 'Kowalski', 'Wiśniewski', 'Lewandowski'],
    SWE: ['Lindqvist', 'Berg', 'Holm', 'Sandberg'],
    USA: ['Miller', 'Carter', 'Brooks', 'Hayes'],
    AUT: ['Gruber', 'Huber', 'Bauer'],
    CZE: ['Novák', 'Svoboda', 'Dvořák'],
  };
  const NAT_WEIGHTS = [['ENG', 34], ['NED', 14], ['GER', 10], ['DEN', 5], ['BEL', 5], ['SCO', 5], ['WAL', 4], ['IRL', 4], ['AUS', 4], ['POL', 3], ['SWE', 2], ['USA', 3], ['AUT', 2], ['CZE', 2]];

  // ---------- Turneringer ----------
  // fmt: liste af "first to" pr. runde fra sidste runde baglæns: final først.
  // field: 'tour' (alle tourkort), 'oom:N', 'pro:N', 'nontour', 'open'
  // prize: præmie pr. placering fra vinder og nedefter (W, F, SF, QF, L16, L32, L64, L128)
  const T = {
    qschool: { name: 'Q-School', short: 'QS', tier: 'Q-School', size: 128, field: 'nontour', sets: false, rounds: [5, 5, 5, 5, 5, 6, 6], prize: [0, 0, 0, 0, 0, 0, 0, 0], ranked: false, color: '#64748b', desc: 'Kvalifikation til PDC Tour Card. Semifinalister får tourkort i to år.' },
    challenge: { name: 'Challenge Tour', short: 'CT', tier: 'Challenge Tour', size: 128, field: 'nontour', sets: false, rounds: [5, 5, 5, 5, 5, 5, 5], prize: [3000, 1500, 750, 500, 300, 200, 100, 0], ranked: false, ct: true, color: '#78716c', desc: 'For spillere uden tourkort. Top 2 på Challenge Tour-ranglisten får tourkort.' },
    pc: { name: 'Players Championship', short: 'PC', tier: 'Pro Tour', size: 128, field: 'tour', sets: false, rounds: [6, 6, 6, 6, 6, 6, 8], prize: [15000, 10000, 5000, 3500, 2500, 2000, 1500, 0], ranked: true, pro: true, color: '#0ea5e9', desc: 'Floor-turnering for alle 128 tourkort-holdere. Best of 11 legs.' },
    et: { name: 'European Tour', short: 'ET', tier: 'European Tour', size: 64, byes: 16, field: 'pro:48', sets: false, rounds: [6, 6, 6, 6, 7, 8], prize: [30000, 12000, 8500, 6000, 4000, 2500, 1250], ranked: true, pro: true, color: '#8b5cf6', desc: '48 spillere – top 16 på Pro Tour-ranglisten seedes direkte i 2. runde.' },
    masters: { name: 'The Masters', short: 'MAS', tier: 'Major', size: 32, byes: 8, field: 'oom:24', sets: false, rounds: [6, 10, 10, 11, 11], prize: [65000, 30000, 20000, 15000, 10000, 7500], ranked: false, color: '#f59e0b', desc: 'Top 24 på PDC Order of Merit. Ikke rangeret.' },
    ukopen: { name: 'UK Open', short: 'UKO', tier: 'Major', size: 128, field: 'tour', sets: false, rounds: [6, 6, 10, 10, 10, 11, 11], prize: [120000, 50000, 30000, 20000, 12000, 7500, 5000, 2500], ranked: true, color: '#ef4444', desc: '"FA Cup of Darts" – åben lodtrækning uden seedning.', unseeded: true },
    matchplay: { name: 'World Matchplay', short: 'WMP', tier: 'Major', size: 32, field: 'oom:32', sets: false, rounds: [10, 11, 16, 17, 18], prize: [800000, 400000, 200000, 100000, 50000, 25000], ranked: true, color: '#f97316', desc: 'Winter Gardens, Blackpool. Lange legs-kampe – first to 18 i finalen.' },
    grandprix: { name: 'World Grand Prix', short: 'WGP', tier: 'Major', size: 32, field: 'oom:32', sets: true, rounds: [2, 3, 3, 4, 5], prize: [120000, 60000, 40000, 25000, 15000, 10000], ranked: true, doubleIn: true, color: '#22c55e', desc: 'Double-in! Hvert leg skal startes på en double. Sets-format.' },
    eurochamp: { name: 'European Championship', short: 'EC', tier: 'Major', size: 32, field: 'pro:32', sets: false, rounds: [6, 10, 10, 11, 11], prize: [120000, 60000, 40000, 25000, 15000, 10000], ranked: true, color: '#6366f1', desc: 'Top 32 på European Tour-/Pro Tour-ranglisten.' },
    grandslam: { name: 'Grand Slam of Darts', short: 'GS', tier: 'Major', size: 32, field: 'oom:32', sets: false, rounds: [10, 10, 16, 16, 16], prize: [150000, 70000, 50000, 25000, 15000, 10000], ranked: true, color: '#e11d48', desc: 'Forenklet til knockout med 32 spillere.' },
    pcfinals: { name: 'Players Championship Finals', short: 'PCF', tier: 'Major', size: 64, field: 'pro:64', sets: false, rounds: [6, 6, 10, 10, 11, 11], prize: [120000, 60000, 30000, 20000, 12000, 7500, 5000], ranked: true, color: '#06b6d4', desc: 'Top 64 på Pro Tour-ranglisten.' },
    worlds: { name: 'PDC World Championship', short: 'WC', tier: 'VM', size: 128, field: 'worlds', sets: true, rounds: [3, 3, 4, 4, 5, 6, 7], prize: [1000000, 400000, 200000, 100000, 60000, 35000, 25000, 15000], ranked: true, color: '#dc2626', desc: 'Alexandra Palace, London. 128 spillere, sets. Vinderen får £1 mio.' },
    premier: { name: 'Premier League', short: 'PL', tier: 'Premier League', league: true, size: 8, field: 'oom:8', legs: 6, playoff: [10, 11], prize: [350000, 175000, 110000, 110000, 95000, 90000, 85000, 80000], ranked: false, color: '#a855f7', desc: 'De 8 bedste i en ligaturnering over 14 runder + playoffs i London.' },
  };

  // Sæsonkalender: uge -> liste af turnerings-id (type)
  function buildCalendar() {
    const cal = {};
    const add = (w, type, label) => { (cal[w] = cal[w] || []).push({ type, label }); };
    add(2, 'qschool', 'Q-School dag 1');
    add(2, 'qschool', 'Q-School dag 2');
    add(5, 'masters', 'The Masters');
    let pc = 1, et = 1, ct = 1;
    const pcWeeks = [7, 9, 11, 13, 15, 18, 20, 23, 25, 28, 31, 33, 35, 37, 39, 41, 43, 44];
    pcWeeks.forEach((w) => { add(w, 'pc', 'Players Championship ' + pc++); add(w, 'pc', 'Players Championship ' + pc++); });
    const etNames = ['Belgian Darts Open', 'German Darts Grand Prix', 'Dutch Darts Championship', 'Austrian Darts Open', 'Baltic Sea Darts Open', 'Czech Darts Open', 'Hungarian Darts Trophy', 'Danish Darts Open', 'Swiss Darts Trophy', 'Flanders Darts Trophy'];
    [8, 12, 14, 17, 21, 24, 27, 32, 36, 38].forEach((w, i) => add(w, 'et', etNames[i]));
    [6, 10, 16, 19, 22, 26, 30, 34, 40, 42].forEach((w) => add(w, 'challenge', 'Challenge Tour ' + ct++));
    add(10, 'ukopen', 'UK Open');
    add(29, 'matchplay', 'World Matchplay');
    add(40, 'grandprix', 'World Grand Prix');
    add(43, 'eurochamp', 'European Championship');
    add(46, 'grandslam', 'Grand Slam of Darts');
    add(47, 'pcfinals', 'Players Championship Finals');
    add(51, 'worlds', 'PDC World Championship');
    return cal;
  }
  const PL_WEEKS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const PL_PLAYOFF_WEEK = 21;

  function weekToDate(season, week) {
    const d = new Date(season, 0, 1 + (week - 1) * 7);
    return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
  }

  G.DartData = { NATIONS, REAL, FIRST, LAST, NAT_WEIGHTS, T, buildCalendar, PL_WEEKS, PL_PLAYOFF_WEEK, weekToDate };
})(typeof window !== 'undefined' ? window : globalThis);
