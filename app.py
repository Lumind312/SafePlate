from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# Load allergen database
# --------------------------------------------------

df = pd.read_csv("FoodData.csv")
df = df[["Food", "Allergy"]]

# Remove empty values
df = df.dropna(subset=["Food", "Allergy"])

# Create:
# {
#   "milk": ["milk", "yogurt", "cheese", ...],
#   "peanut": ["peanut", ...],
# }
ALLERGENS = (
    df.groupby("Allergy")["Food"]
    .apply(list)
    .to_dict()
)

# --------------------------------------------------
# Load recipe NER model
# --------------------------------------------------

ner = pipeline(
    "ner",
    model="rgonzale/recipe-ner-model",
    aggregation_strategy="simple"
)


# --------------------------------------------------
# Allergen detection
# --------------------------------------------------

def find_allergens(ingredients, selected_allergens=None):
    """
    Find allergens contained in detected ingredients.

    ingredients:
        [
            {
                "text": "whole milk",
                "confidence": 0.98
            }
        ]

    selected_allergens:
        ["milk", "peanut"]
    """

    found = {}

    # Normalize selected allergens
    if selected_allergens:
        selected_allergens = [
            allergy.lower().strip()
            for allergy in selected_allergens
        ]

    for ingredient in ingredients:
        text = ingredient["text"].lower().strip()

        for allergen, foods in ALLERGENS.items():

            # If user selected allergies, only check those
            if selected_allergens:
                if allergen.lower() not in selected_allergens:
                    continue

            for food in foods:

                if not isinstance(food, str):
                    continue

                food = food.lower().strip()

                if food and food in text:
                    found.setdefault(allergen, []).append(
                        ingredient["text"]
                    )
                    break

    return found


# --------------------------------------------------
# Recipe analyzer
# --------------------------------------------------

def analyze_recipe(recipe_text, selected_allergens=None):

    entities = ner(recipe_text)

    ingredients = []

    for entity in entities:

        if entity["entity_group"] == "FOOD":

            ingredients.append({
                "text": entity["word"],
                "confidence": round(
                    float(entity["score"]),
                    3
                )
            })

    allergens = find_allergens(
        ingredients,
        selected_allergens
    )

    return {
        "ingredients": ingredients,
        "allergens": allergens
    }


# --------------------------------------------------
# API: Get available allergens
# --------------------------------------------------

@app.route("/api/allergens", methods=["GET"])
def get_allergens():

    allergens = sorted([
        allergy
        for allergy in ALLERGENS.keys()
    ])

    return jsonify({
        "allergens": allergens
    })


# --------------------------------------------------
# API: Analyze recipe
# --------------------------------------------------

@app.route("/api/analyze", methods=["POST"])
def analyze():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No JSON data provided."
        }), 400

    recipe = data.get("recipe", "")
    selected_allergens = data.get(
        "allergens",
        []
    )

    if not recipe.strip():

        return jsonify({
            "error": "Please provide a recipe."
        }), 400

    try:

        result = analyze_recipe(
            recipe,
            selected_allergens
        )

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok"
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
