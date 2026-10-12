import csv
import re
from collections import defaultdict
from functools import lru_cache


def load_food_data(csv_path="FoodData.csv"):
    """Load and normalize the food database."""
    foods = []

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        required = {"Class", "Type", "Group", "Food", "Allergy"}
        columns = set(reader.fieldnames or [])
        missing = required - columns

        if missing:
            raise ValueError(
                f"Missing CSV columns: {', '.join(sorted(missing))}"
            )

        for row in reader:
            food = (row.get("Food") or "").strip()
            allergy = (row.get("Allergy") or "").strip()

            if not food:
                continue

            foods.append({
                "class": (row.get("Class") or "").strip(),
                "type": (row.get("Type") or "").strip(),
                "group": (row.get("Group") or "").strip(),
                "food": food,
                "allergy": allergy,
            })

    return foods


# Common irregular plurals and spelling variations.
# Extend this dictionary to fit your recipes.
FOOD_VARIATIONS = {
    "almond": ["almonds"],
    "apple": ["apples"],
    "apricot": ["apricots"],
    "bean": ["beans"],
    "black-eyed bean": ["black-eyed beans"],
    "broad bean": ["broad beans"],
    "butter bean": ["butter beans"],
    "kidney bean": ["kidney beans"],
    "white bean": ["white beans"],
    "walnut": ["walnuts"],
    "pecan": ["pecans"],
    "peanut": ["peanuts"],
    "chestnut": ["chestnuts"],
    "lentil": ["lentils"],
    "pea": ["peas"],
    "peas": ["pea"],
    "egg": ["eggs"],
    "egg plant": ["eggplants", "aubergine", "aubergines"],
    "blackberry": ["blackberries"],
    "blueberry": ["blueberries"],
    "strawberry": ["strawberries"],
    "raspberry": ["raspberries"],
    "cherry": ["cherries"],
    "cranberry": ["cranberries"],
    "grape": ["grapes"],
    "orange": ["oranges"],
    "lemon": ["lemons"],
    "lime": ["limes"],
    "potato": ["potatoes"],
    "sweet potato": ["sweet potatoes"],
    "tomato": ["tomatoes"],
    "carrot": ["carrots"],
    "onion": ["onions"],
    "garlic": ["garlic cloves"],
    "mushroom": ["mushrooms"],
    "button mushroom": ["button mushrooms"],
    "shiitake mushroom": ["shiitake mushrooms"],
    "milk": ["whole milk", "skim milk"],
    "yogurt": ["yogurts", "yoghurt", "yoghurts"],
    "ice cream": ["ice creams"],
    "sweet pepper": ["sweet peppers", "bell pepper", "bell peppers"],
    "brussels sprouts": ["brussels sprout"],
    "water melon": ["watermelon", "watermelons"],
    "black-eyed bean": ["black-eyed beans"],
}


def make_pattern(term):
    """Create a case-insensitive whole-phrase pattern."""
    return re.compile(
        r"(?<!\w)" + re.escape(term) + r"(?!\w)",
        re.IGNORECASE
    )


@lru_cache(maxsize=1)
def get_food_data(csv_path="FoodData.csv"):
    """Cache the loaded database so it is not reread for each recipe."""
    return load_food_data(csv_path)


def analyze_recipe(recipe_text, selected_allergens=None,
                   csv_path="FoodData.csv"):
    """
    Return a list of matching allergy categories and food records.

    selected_allergens:
        None -> check every food with a nonblank Allergy value.
        A list of category names -> check only those categories.
    """
    if not isinstance(recipe_text, str):
        raise TypeError("recipe_text must be a string")

    foods = get_food_data(csv_path)

    if selected_allergens is None:
        selected = None
    elif isinstance(selected_allergens, str):
        selected = {selected_allergens.strip().casefold()}
    else:
        selected = {
            item.strip().casefold()
            for item in selected_allergens
            if isinstance(item, str) and item.strip()
        }

    # Category -> food name -> result
    found = defaultdict(dict)

    for item in foods:
        food = item["food"]
        allergy = item["allergy"]

        # Skip foods without a category, or categories not selected.
        if not allergy:
            continue

        if selected is not None and allergy.casefold() not in selected:
            continue

        # Canonical name plus explicitly configured variations.
        terms = [food]
        terms.extend(FOOD_VARIATIONS.get(food.casefold(), []))

        # Also recognize a basic plural for many regular food names.
        if food.casefold() not in FOOD_VARIATIONS:
            if food.casefold().endswith(("s", "x", "z", "ch", "sh")):
                terms.append(food + "es")
            elif food.casefold().endswith("y") and len(food) > 1:
                if food[-2].lower() not in "aeiou":
                    terms.append(food[:-1] + "ies")
                else:
                    terms.append(food + "s")
            else:
                terms.append(food + "s")

        for term in dict.fromkeys(terms):
            match = make_pattern(term).search(recipe_text)

            if match:
                key = food.casefold()

                found[allergy][key] = {
                    "food": food,
                    "matched_text": match.group(0),
                    "class": item["class"],
                    "type": item["type"],
                    "group": item["group"],
                }
                break

    return [
        {
            "allergy": allergy,
            "ingredients": sorted(
                foods_found.values(),
                key=lambda x: x["food"].casefold()
            ),
        }
        for allergy, foods_found in sorted(found.items())
    ]


if __name__ == "__main__":
    recipe = """
    Combine almond flour, apples, and barley.
    Add milk, walnuts, black-eyed beans, and sweet potatoes.
    """

    selected = [
        "Nut Allergy",
        "Oral Allergy Syndrome",
        "Gluten Allergy",
        "Milk allergy / Lactose intolerance",
        "Legume Allergy",
        "Potato Allergy",
    ]

    results = analyze_recipe(recipe, selected)

    for result in results:
        print(f"\n{result['allergy']}:")
        for item in result["allergens"]:
            print(
                f"  {item['food']} "
                f"(matched: {item['matched_text']})"
            )