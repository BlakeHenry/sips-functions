import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloDad = functions.https.onRequest((request, response) => {
    console.log("Said hello to dad");
    response.send("Hello dad. This is google cloud functions. I'll use " +
        "them to update the average score for reviews in the app I'm making");
});

const reviewsTable = "reviews";
const reviewableTable = "reviewables";

interface Review {
    Id: string;
    userId: string;
    reviewableId: string;
    recommended: boolean;
    description: string;
}

// interface Reviewable {
//     name: string;
//     makerId: string;
//     makerName: string;
//     recommendedPercentage: number;
// }

export const createReview = functions.firestore.document("reviews/{reviewId}")
    .onCreate(async (snapshot, context) => {
    const reviewAdded = snapshot.data() as Review;

    functions.logger.log(context.timestamp + "Added a review with ID: " + snapshot.id);

    // Get all reviews for the reviewable.
    const reviewDocs = await admin.firestore().collection(reviewsTable)
        .where("reviewableId", "==", reviewAdded.reviewableId).get();

    let recommendations = 0;
    reviewDocs.forEach((doc) => {
        const review = doc.data() as Review;

        if (review.recommended === true) {
            recommendations += 1;
        }
        });
    const totalReviews = reviewDocs.size;
    const newRecommendedPercentage= Math.trunc((recommendations / totalReviews) * 100);
    
    // Update the reviewables recommended percentage.
    // We could optimize this more by tracking review count + old average recommend %
    // (totalReviewCount * recPercentage) + newReviewRec / totalReviewCount
    await admin.firestore().collection(reviewableTable).doc(reviewAdded.reviewableId)
        .update({"recommendedPercentage": newRecommendedPercentage});

    console.log("Set reviewable:" + reviewAdded.reviewableId + "recommended percentage to:" + newRecommendedPercentage);

    return null;
});

// interface tree {
//     type: string;
// }

// export const createATree = functions.https.onRequest((request, response) => {
//     const treeToAdd = request.body as tree;

//     admin.firestore().collection('trees').add(treeToAdd);

//     functions.logger.log('We added a tree');

//     response.send("You made a tree!");
// });

// export const helloAfterCreate = functions.firestore.document('/trees/{documentId}')
//     .onCreate((snapshot, context) => {
//         const treeType = snapshot.data().type;

//         functions.logger.log('we have logged');
//         console.log(treeType);

//         return "We did it!";
//     });
