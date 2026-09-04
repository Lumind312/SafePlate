from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
import pytesseract

from PIL import Image

from transformers import pipeline


# ============================================================
# Flask setup
# ============================================================

app = Flask(__name__)

# Allow requests from the React frontend
CORS(app)


# ============================================================
# Load allergen database
# ============================================================

try:
    food_df = pd.read_csv("FoodData.csv")

    food_df = food_df[["Food", "Allergy"]]

    # Remove rows with missing values
    food_df = food_df.dropna(
        subset=["Food", "Allergy"]
    )

    # Convert FoodData.csv into:
    #
    # {
    #     "milk": ["milk", "yogurt", "cheese"],
    #     "peanut": ["peanut", "peanuts"],
    #     ...
    # }

    ALLERGENS = (
        food_df
        .groupby("Allergy")["Food"]
        .apply(list)
        .to_dict()
    )

    print("Loaded allergen database.")
    print(
        f"Found {len(ALLERGENS)} allergy categories."
    )

except Exception as e:

    print("ERROR loading FoodData.csv:")
    print(e)

    ALLERGENS = {}


# ============================================================
# Load recipe NER model
# ============================================================

print("Loading recipe NER model...")

try:

    ner = pipeline(
        "ner",
        model="rgonzale/recipe-ner-model",
        aggregation_strategy="simple"
    )

    print("Recipe NER model loaded successfully.")

except Exception as e:

    print("ERROR loading recipe NER model:")
    print(e)

    ner = None


# ============================================================
# OCR
# ============================================================

def extract_text_from_image(image_file):
    """
    Use Tesseract OCR to extract text from an image.
    """

    print("Starting OCR...")

    image = Image.open(image_file)

    # Convert image to RGB
    image = image.convert("RGB")

    # OCR configuration
    text = pytesseract.image_to_string(
        image,
        config="--psm 6"
    )

    text = text.strip()

    print("OCR complete.")
    print("OCR text:")
    print(text)

    return text


# ============================================================
# Allergen detection
# ============================================================

def find_allergens(
    ingredients,
    selected_allergens=None
):
    """
    Compare detected ingredients against
    FoodData.csv.
    """

    found = {}

    # Normalize selected allergies
    if selected_allergens:

        selected_allergens = [
            allergy.lower().strip()
            for allergy in selected_allergens
        ]

    for ingredient in ingredients:

        text = ingredient["text"].lower().strip()

        for allergen, foods in ALLERGENS.items():

            # If the user selected allergies,
            # only check those allergies.
            if selected_allergens:

                if allergen.lower() not in selected_allergens:
                    continue

            for food in foods:

                if not isinstance(food, str):
                    continue

                food = food.lower().strip()

                if not food:
                    continue

                if food in text:

                    found.setdefault(
                        allergen,
                        []
                    ).append(
                        ingredient["text"]
                    )

                    break

    return found


# ============================================================
# Recipe analysis
# ============================================================

def analyze_recipe(
    recipe_text,
    selected_allergens=None
):

    if ner is None:

        raise RuntimeError(
            "Recipe NER model could not be loaded."
        )

    if not recipe_text:

        return {
            "ingredients": [],
            "allergens": {}
        }

    print("Running recipe NER...")

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

    print("Detected ingredients:")
    print(ingredients)

    allergens = find_allergens(
        ingredients,
        selected_allergens
    )

    print("Detected allergens:")
    print(allergens)

    return {
        "ingredients": ingredients,
        "allergens": allergens
    }


# ============================================================
# Health check
# ============================================================

@app.route(
    "/api/health",
    methods=["GET"]
)
def health():

    return jsonify({
        "status": "ok"
    })


# ============================================================
# Get allergen list
# ============================================================

@app.route(
    "/api/allergens",
    methods=["GET"]
)
def get_allergens():

    allergens = sorted(
        list(ALLERGENS.keys())
    )

    return jsonify({
        "allergens": allergens
    })


# ============================================================
# Analyze typed recipe
# ============================================================

@app.route(
    "/api/analyze",
    methods=["POST"]
)
def analyze():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "error": "No request data provided."
            }), 400

        recipe = data.get(
            "recipe",
            ""
        )

        selected_allergens = data.get(
            "allergens",
            []
        )

        if not recipe.strip():

            return jsonify({
                "error": "Please enter a recipe."
            }), 400

        result = analyze_recipe(
            recipe,
            selected_allergens
        )

        return jsonify(result)

    except Exception as e:

        print("ERROR in /api/analyze:")
        print(e)

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# Analyze uploaded image
# ============================================================

@app.route(
    "/api/analyze-image",
    methods=["POST"]
)
def analyze_image():

    try:

        # -----------------------------------------
        # Check image
        # -----------------------------------------

        if "image" not in request.files:

            return jsonify({
                "error": "No image was uploaded."
            }), 400

        image = request.files["image"]

        if image.filename == "":

            return jsonify({
                "error": "No image was selected."
            }), 400


        # -----------------------------------------
        # Get selected allergies
        # -----------------------------------------

        allergies_string = request.form.get(
            "allergens",
            ""
        )

        if allergies_string:

            selected_allergens = [
                allergy.strip()
                for allergy in allergies_string.split(",")
                if allergy.strip()
            ]

        else:

            selected_allergens = []


        # -----------------------------------------
        # OCR
        # -----------------------------------------

        extracted_text = extract_text_from_image(
            image
        )

        if not extracted_text:

            return jsonify({
                "error": (
                    "OCR could not detect any text "
                    "in the image."
                )
            }), 400


        # -----------------------------------------
        # Analyze OCR text
        # -----------------------------------------

        result = analyze_recipe(
            extracted_text,
            selected_allergens
        )


        # -----------------------------------------
        # Return OCR text too
        # -----------------------------------------

        result["ocr_text"] = extracted_text

        return jsonify(result)


    except Exception as e:

        print("ERROR in /api/analyze-image:")
        print(e)

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# Run server
# ============================================================

if __name__ == "__main__":

    print("")
    print("====================================")
    print(" SafePlate Backend")
    print("====================================")
    print("")
    print("Server running at:")
    print("http://localhost:5000")
    print("")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
