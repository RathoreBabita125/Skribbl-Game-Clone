const WORDS = {
  animals: [
    "cat", "dog", "elephant", "giraffe", "penguin", "lion", "tiger", "bear",
    "rabbit", "fox", "wolf", "dolphin", "whale", "shark", "eagle", "owl",
    "parrot", "snake", "turtle", "frog", "monkey", "gorilla", "zebra", "hippo",
    "crocodile", "kangaroo", "koala", "panda", "cheetah", "leopard", "deer",
    "moose", "buffalo", "camel", "horse", "cow", "pig", "sheep", "goat",
    "chicken", "duck", "goose", "flamingo", "peacock", "butterfly", "bee",
    "ant", "spider", "crab", "lobster", "octopus", "jellyfish", "seahorse"
  ],
  objects: [
    "chair", "table", "lamp", "phone", "computer", "keyboard", "mouse",
    "television", "refrigerator", "microwave", "oven", "sink", "toilet",
    "shower", "bathtub", "bed", "pillow", "blanket", "mirror", "clock",
    "book", "pencil", "pen", "scissors", "stapler", "ruler", "calculator",
    "backpack", "umbrella", "glasses", "hat", "shoe", "sock", "glove",
    "ring", "necklace", "watch", "wallet", "key", "door", "window",
    "stairs", "elevator", "bridge", "car", "bus", "train", "airplane",
    "bicycle", "motorcycle", "boat", "ship", "submarine", "rocket", "satellite"
  ],
  food: [
    "pizza", "burger", "hotdog", "sandwich", "salad", "soup", "pasta",
    "spaghetti", "noodles", "rice", "bread", "toast", "butter", "cheese",
    "milk", "egg", "bacon", "steak", "chicken", "fish", "sushi", "taco",
    "burrito", "waffle", "pancake", "cake", "cookie", "donut", "ice cream",
    "chocolate", "candy", "lollipop", "apple", "banana", "orange", "strawberry",
    "watermelon", "grapes", "mango", "pineapple", "cherry", "lemon", "lime",
    "carrot", "potato", "tomato", "broccoli", "corn", "mushroom", "onion",
    "garlic", "pepper", "cucumber", "lettuce", "avocado", "coffee", "tea"
  ],
  actions: [
    "running", "jumping", "swimming", "flying", "dancing", "singing",
    "laughing", "crying", "sleeping", "eating", "drinking", "cooking",
    "reading", "writing", "drawing", "painting", "playing", "working",
    "driving", "walking", "climbing", "falling", "fighting", "hugging",
    "kissing", "waving", "pointing", "pushing", "pulling", "lifting",
    "throwing", "catching", "kicking", "punching", "shooting", "fishing",
    "hunting", "hiking", "skiing", "surfing", "diving", "skating",
    "boxing", "wrestling", "yoga", "stretching", "meditating", "praying"
  ],
  places: [
    "beach", "mountain", "forest", "desert", "jungle", "ocean", "river",
    "lake", "waterfall", "volcano", "island", "cave", "cliff", "valley",
    "meadow", "farm", "village", "city", "town", "castle", "palace",
    "temple", "church", "mosque", "pyramid", "stadium", "airport", "harbor",
    "lighthouse", "museum", "library", "school", "hospital", "police station",
    "fire station", "supermarket", "restaurant", "hotel", "cinema", "theater",
    "park", "zoo", "aquarium", "amusement park", "theme park", "circus"
  ],
  nature: [
    "sun", "moon", "star", "cloud", "rain", "snow", "thunder", "lightning",
    "rainbow", "fog", "wind", "tornado", "hurricane", "tsunami", "earthquake",
    "volcano", "glacier", "iceberg", "coral reef", "flower", "tree", "bush",
    "grass", "leaf", "seed", "root", "branch", "trunk", "bark", "mushroom",
    "cactus", "seaweed", "rock", "stone", "sand", "mud", "ice", "fire",
    "smoke", "steam", "wave", "tide", "current", "pond", "swamp", "marsh"
  ]
};

const getAllWords = () => {
  return Object.values(WORDS).flat();
};

const getRandomWords = (count = 3) => {
  const all = getAllWords();
  const shuffled = all.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const getWordsByCategory = (category) => {
  return WORDS[category] || getAllWords();
};

module.exports = { WORDS, getAllWords, getRandomWords, getWordsByCategory };
