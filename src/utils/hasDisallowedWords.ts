const disallowList =
[
    "#BLM", "#MAGA", "#resist", "abortion", "Alexandria Ocasio-Cortez", "alt-left", "alt-right", "anarchy",
    "Angela Merkel", "antifa", "autocracy", "ballot", "Bernie Sanders", "BLM", "blue lives matter", "border",
    "Boris Johnson", "brexit", "campaign", "capitalism", "CIA", "civil rights", "climate change", "collusion",
    "communism", "communist party", "congress", "conservative", "coup", "death penalty", "defund the police",
    "democrat", "democrats", "department", "dictator", "Trump", "drain the swamp", "election", "election fraud",
    "Elizabeth Warren", "Emmanuel Macron", "fascism", "FBI", "federal", "freedom of speech", "government", "governor",
    "green party", "gun control", "gun rights", "healthcare", "Hillary Clinton", "immigration", "impeachment",
    "insurrection", "IRS", "Jair Bolsonaro", "Joe Biden", "Justin Trudeau", "Kamala Harris", "labor party",
    "law enforcement", "left-wing", "LGBT rights", "liberal", "libertarian", "local government", "lock her up",
    "MAGA", "make america great again", "mayor", "midterms", "Mitch McConnell", "Nancy Pelosi", "Narendra Modi",
    "nationalists", "neoconservatives", "neoliberals", "no justice no peace", "NSA", "parliament", "politician",
    "politics", "populism", "president", "prime minister", "progressives", "protests", "proud boys", "QAnon",
    "Recep Erdogan", "referendum", "reform", "republican", "republicans", "revolution", "right-wing", "riots",
    "Ron DeSantis", "sedition", "senate", "socialism", "socialist party", "Supreme Court", "taxation", "Ted Cruz",
    "Vladimir Putin", "vote", "voting", "welfare", "Xi Jinping"
];

function hasDisallowedWords(songName: string): boolean {
    return disallowList.some(word => songName.toLowerCase().includes(word.toLowerCase()));
  }