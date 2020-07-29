// Data from Wikipedia
// https://en.wikipedia.org/wiki/List_of_aircraft_type_designators
var AIRCRAFT_TYPE_DESIGNATORS = new Map([
  ["A109", "SABCA A-109"],
  ["A124", "Antonov AN-124"],
  ["A140", "Antonov AN-140"],
  ["A148", "Antonov An-148"],
  ["A158", "Antonov An-158"],
  ["A19N", "Airbus A319neo"],
  ["A20N", "Airbus A320neo"],
  ["A21N", "Airbus A321neo"],
  ["A210", "Aquila A 210"],
  ["A225", "Antonov An-225"],
  ["A30B", "Airbus A300B/C"],
  ["A306", "Airbus A300-600"],
  ["A3ST", "Airbus A300-600ST Beluga"],
  ["A310", "Airbus A310-200"],
  ["A318", "Airbus A318"],
  ["A319", "Airbus A319"],
  ["A320", "Airbus A320"],
  ["A321", "Airbus A321"],
  ["A332", "Airbus A330-200"],
  ["A333", "Airbus A330-300"],
  ["A337", "Airbus A330-700 Beluga XL"],
  ["A338", "Airbus A330-800neo"],
  ["A339", "Airbus A330-900neo"],
  ["A342", "Airbus A340-200"],
  ["A343", "Airbus A340-300"],
  ["A345", "Airbus A340-500"],
  ["A346", "Airbus A340-600"],
  ["A359", "Airbus A350-900"],
  ["A35K", "Airbus A350-1000"],
  ["A388", "Airbus A380-800"],
  ["A400", "Airbus A400M Atlas"],
  ["A5", "ICON A5"],
  ["A748", "Hawker Siddeley HS 748"],
  ["AC68", "Gulfstream Commander"],
  ["AC90", "Gulfstream Turbo Commander"],
  ["AJ27", "COMAC ARJ21"],
  ["AN12", "Antonov AN-12"],
  ["AN24", "Antonov AN-24"],
  ["AN26", "Antonov AN-26"],
  ["AN28", "Antonov AN-28"],
  ["AN30", "Antonov AN-30"],
  ["AN32", "Antonov AN-32"],
  ["AN72", "Antonov AN-72/74"],
  ["AP22", "Aeroprakt A-22"],
  ["AS32", "Eurocopter AS332 Super Puma"],
  ["AS50", "Eurocopter AS350"],
  ["AT43", "Aerospatiale 42-300/320"],
  ["AT45", "Aerospatiale 42-500"],
  ["AT46", "Aerospatiale 42-600"],
  ["AT72", "Aerospatiale 72"],
  ["AT73", "Aerospatiale 72-200"],
  ["AT75", "Aerospatiale 72-500"],
  ["AT76", "Aerospatiale 72-600"],
  ["ATL", "Robin ATL"],
  ["ATP", "British Aerospace ATP"],
  ["B105", "Eurocopter (MBB) Bo.105"],
  ["B190", "Beechcraft 1900"],
  ["B212", "Bell 212"],
  ["B412", "Bell 412"],
  ["B429", "Bell 429"],
  ["B37M", "Boeing 737 MAX 7"],
  ["B38M", "Boeing 737 MAX 8"],
  ["B39M", "Boeing 737 MAX 9"],
  ["B3XM", "Boeing 737 MAX 10"],
  ["B461", "BAe 146-100"],
  ["B462", "BAe 146-200"],
  ["B463", "BAe 146-300"],
  ["B703", "Boeing 707"],
  ["B712", "Boeing 717"],
  ["B720", "Boeing 720B"],
  ["B721", "Boeing 727-100"],
  ["B722", "Boeing 727-200"],
  ["B732", "Boeing 737-200"],
  ["B733", "Boeing 737-300"],
  ["B734", "Boeing 737-400"],
  ["B735", "Boeing 737-500"],
  ["B736", "Boeing 737-600"],
  ["B737", "Boeing 737-700"],
  ["B738", "Boeing 737-800"],
  ["B739", "Boeing 737-900"],
  ["B741", "Boeing 747-100"],
  ["B742", "Boeing 747-200"],
  ["B743", "Boeing 747-300"],
  ["B744", "Boeing 747-400"],
  ["B748", "Boeing 747-8I"],
  ["B74R", "Boeing 747SR"],
  ["B74S", "Boeing 747SP"],
  ["B752", "Boeing 757-200"],
  ["B753", "Boeing 757-300"],
  ["B762", "Boeing 767-200"],
  ["B763", "Boeing 767-300"],
  ["B764", "Boeing 767-400ER"],
  ["B772", "Boeing 777-200"],
  ["B77L", "Boeing 777-200 Freighter"],
  ["B773", "Boeing 777-300"],
  ["B77W", "Boeing 777-300ER"],
  ["B778", "Boeing 777-8"],
  ["B779", "Boeing 777-9"],
  ["B788", "Boeing 787-8"],
  ["B789", "Boeing 787-9"],
  ["B78X", "Boeing 787-10"],
  ["BA11", "British Aerospace (BAC) One Eleven"],
  ["BCS1", "Airbus A220-100"],
  ["BCS3", "Airbus A220-300"],
  ["BE55", "Beechcraft Baron 55"],
  ["BE58", "Beechcraft Baron 58"],
  ["BELF", "Shorts SC-5 Belfast"],
  ["BER2", "Beriev Be-200 Altair"],
  ["BL8", "8KCAB Decathlon", " 8GCBC Scout"],
  ["BLCF", "Boeing 747 Dreamlifter"],
  ["BN2P", "BN-2A/B Islander"],
  ["C130", "LM C-130 Hercules"],
  ["C152", "Cessna 152"],
  ["C162", "Cessna 162"],
  ["C172", "Cessna 172"],
  ["C72R", "Cessna 172"],
  ["C77R", "Cessna 177"],
  ["C182", "Cessna 182"],
  ["C206", "Cessna 206"],
  ["C208", "Cessna 208"],
  ["C210", "Cessna 210"],
  ["C212", "CASA / IPTN 212 Aviocar"],
  ["C25A", "Cessna Cit. CJ2"],
  ["C25B", "Cessna Cit. CJ3"],
  ["C25C", "Cessna Cit. CJ4"],
  ["C30J", "LM C-130J Hercules"],
  ["C310", "Cessna 310"],
  ["C46", "Curtiss C-46 Commando"],
  ["C500", "Cessna Cit. I"],
  ["C510", "Cessna Cit. Mustang"],
  ["C525", "Cessna Cit.Jet"],
  ["C550", "Cessna Cit. II"],
  ["C560", "Cessna Cit. V"],
  ["C56X", "Cessna Cit. Excel"],
  ["C650", "Cessna Cit."],
  ["C680", "Cessna Cit. Sovereign"],
  ["C750", "Cessna Cit. X"],
  ["C919", "COMAC C919"],
  ["CH7A", "7AC Champ"],
  ["CH7B", "7GCAA"],
  ["CL2T", "Bombardier 415"],
  ["CL30", "Bombardier BD-100 Challenger 300"],
  ["CL60", "Canadair Challenger"],
  ["CN35", "CASA/IPTN CN-235"],
  ["CONC", "Concorde"],
  ["CONI", "Lockheed L-1049 Super Constellation"],
  ["CRJ1", "Canadair Regional Jet 100"],
  ["CRJ2", "Canadair Regional Jet 200"],
  ["CRJ7", "Canadair Regional Jet 700"],
  ["CRJ9", "Canadair Regional Jet 900"],
  ["CRJX", "Canadair Regional Jet 1000"],
  ["CVLP", "Convair CV-240/440"],
  ["CVLT", "Convair CV-580/600/640"],
  ["D228", "Fairchild Dornier Do.228"],
  ["D328", "Fairchild Dornier Do.328"],
  ["DA42", "Diamond DA42"],
  ["DA62", "Diamond DA62"],
  ["DC10", "Douglas DC-10/15"],
  ["DC3", "Douglas DC-3"],
  ["DC6", "Douglas DC-6"],
  ["DC85", "Douglas DC-8-50"],
  ["DC86", "Douglas DC-8-62"],
  ["DC87", "Douglas DC-8-72"],
  ["DC91", "Douglas DC-9-10"],
  ["DC92", "Douglas DC-9-20"],
  ["DC93", "Douglas DC-9-30"],
  ["DC94", "Douglas DC-9-40"],
  ["DC95", "Douglas DC-9-50"],
  ["DH2T", "De Havilland DHC-2"],
  ["DH8A", "De Havilland DHC-8-100"],
  ["DH8B", "De Havilland DHC-8-200"],
  ["DH8C", "De Havilland DHC-8-300"],
  ["DH8D", "De Havilland DHC-8-400"],
  ["DHC2", "De Havilland DHC-2"],
  ["DHC3", "De Havilland DHC-3"],
  ["DHC4", "De Havilland DHC-4"],
  ["DHC5", "De Havilland DHC-5"],
  ["DHC6", "De Havilland DHC-6"],
  ["DHC7", "De Havilland DHC-7"],
  ["DOVE", "De Havilland DH.104 Dove"],
  ["E110", "Embraer EMB 110"],
  ["E120", "Embraer EMB 120"],
  ["E135", "Embraer RJ135"],
  ["E145", "Embraer RJ145"],
  ["E170", "Embraer 170"],
  ["E75S/L", "Embraer 175"],
  ["E190", "Embraer 190"],
  ["E290", "Embraer E190-E2"],
  ["E195", "Embraer 195"],
  ["E295", "Embraer E195-E2"],
  ["E35L", "Embraer Legacy 600/650"],
  ["E545", "Embraer Legacy 450/500"],
  ["E550", "Embraer Legacy 500/600"],
  ["E50P", "Embraer Phenom 100"],
  ["E55P", "Embraer Phenom 300"],
  ["E75L", "Embraer 175"],
  ["E75S", "Embraer 175"],
  ["EC20", "Eurocopter EC120 Colibri"],
  ["EC25", "Eurocopter EC225 Super Puma"],
  ["EC35", "Eurocopter EC135/635"],
  ["EC45", "Eurocopter EC145"],
  ["P212", "Tecnam P2012"],
  ["ECHO", "Tecnam P92"],
  ["EV97", "EV-97 EuroStar/Harmony"],
  ["EVSS", "Evektor SportStar"],
  ["EXPL", "MD Helicopters MD900"],
  ["F100", "Fokker 100"],
  ["F27", "Fokker F27"],
  ["F28", "Fokker F28"],
  ["F2TH", "Dassault Falcon 2000"],
  ["F406", "Reims-Cessna F406"],
  ["F50", "Fokker 50"],
  ["F70", "Fokker 70"],
  ["F900", "Dassault Falcon 900"],
  ["FA20", "Dassault Falcon 20"],
  ["FA50", "Dassault Falcon 50"],
  ["FA7X", "Dassault Falcon 7X"],
  ["G159", "Gulfstream Aerospace G-159"],
  ["G21", "Grumman G-21"],
  ["G280", "Gulfstream G280"],
  ["G73T", "Grumman G-73"],
  ["GA8", "GippsAero GA8"],
  ["GL5T", "Bombardier BD-700"],
  ["GLEX", "Bombardier Global Express / Raytheon Sentinel"],
  ["GLF4", "Gulfstream IV"],
  ["GLF5", "Gulfstream V"],
  ["GLF6", "Gulfstream G650"],
  ["GOLF", "Tecnam P96"],
  ["HERN", "De Havilland DH.114 Heron"],
  ["H25B", "British Aerospace 125"],
  ["H25C", "British Aerospace 125-1000"],
  ["HDJT", "Honda HA-420"],
  ["I114", "Ilyushin IL114"],
  ["IL18", "Ilyushin IL18"],
  ["IL62", "Ilyushin IL62"],
  ["IL76", "Ilyushin IL76"],
  ["IL86", "Ilyushin IL86"],
  ["IL96", "Ilyushin IL96"],
  ["J328", "Fairchild Dornier 328JET"],
  ["JS31", "British Aerospace Jetstream 31"],
  ["JS32", "British Aerospace Jetstream 32"],
  ["JS41", "British Aerospace Jetstream 41"],
  ["JU52", "Junkers Ju 52/3M"],
  ["L101", "Lockheed L-1011 Tristar"],
  ["L188", "Lockheed L-188 Electra"],
  ["L410", "LET 410"],
  ["LJ35", "Learjet 35 / 36 / C-21A"],
  ["LJ60", "Learjet 60"],
  ["MD11", "McDonnell Douglas MD-11"],
  ["MD81", "McDonnell Douglas MD-81"],
  ["MD82", "McDonnell Douglas MD-82"],
  ["MD83", "McDonnell Douglas MD-83"],
  ["MD87", "McDonnell Douglas MD-87"],
  ["MD88", "McDonnell Douglas MD-88"],
  ["MD90", "McDonnell Douglas MD-90"],
  ["MI8", "Mil Mi-8/17/171/172"],
  ["MI24", "Mil Mi-24/25/35"],
  ["MU2", "Mitsubishi Mu-2"],
  ["N262", "Aerospatiale (Nord) 262"],
  ["NOMA", "GAF N22B / N24A"],
  ["P06T", "Tecnam P2006T"],
  ["P28A", "Piper PA-28"],
  ["P28B", "Piper PA-28"],
  ["P68", "Partenavia P.68"],
  ["P180", "Piaggio P.180"],
  ["P208", "Tecnam P2008"],
  ["P210", "Cessna P210"],
  ["PA31", "Piper PA-31"],
  ["PA44", "Piper PA-44"],
  ["PA46", "Piper PA-46"],
  ["PC12", "Pilatus PC-12"],
  ["PC6T", "Pilatus PC-6"],
  ["PISI", "Pipistrel Sinus"],
  ["PITA", "Pipistrel Taurus"],
  ["PIVI", "Pipistrel Virus"],
  ["RJ1H", "Avro RJ100"],
  ["R200", "Robin HR200/R2000"],
  ["RJ70", "Avro RJ70"],
  ["RJ85", "Avro RJ85"],
  ["S210", "Aerospatiale (Sud) Se.210"],
  ["S58T", "Sikorsky S-58T"],
  ["S601", "Aerospatiale SN.601"],
  ["S61", "Sikorsky S-61"],
  ["S65C", "Eurocopter SA365C/SA365N"],
  ["S76", "Sikorsky S-76"],
  ["S92", "Sikorsky S-92"],
  ["SB20", "Saab 2000"],
  ["SC7", "Shorts SC-7"],
  ["SF34", "Saab SF340A/B"],
  ["SF50", "Cirrus SF50"],
  ["SH33", "Shorts SD.330"],
  ["SH36", "Shorts SD.360"],
  ["SIRA", "Tecnam P2002"],
  ["SU95", "Sukhoi Superjet 100-95"],
  ["TRF1", "Team Rocket F1"],
  ["T134", "Tupolev Tu-134"],
  ["T144", "Tupolev Tu-144"],
  ["T154", "Tupolev Tu-154"],
  ["T204", "Tupolev Tu-204/214"],
  ["TB20", "Socata TB-20"],
  ["TL20", "TL Ultralight TL-96/2000"],
  ["TRIS", "Pilatus BN-2A Mk III"],
  ["TWEN", "Tecnam P2010"],
  ["WW24", "IAI 1124 Westwind"],
  ["Y12", "Harbin Yunshuji Y12"],
  ["YK40", "Yakovlev Yak-40"],
  ["YK42", "Yakovlev Yak-42"],
  ["YS11", "NAMC YS-11"]
]);
