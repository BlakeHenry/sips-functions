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

export const createReview = functions.https.onRequest(async (request, response) => {
    const reviewToAdd = request.body as Review;

    const result = await admin.firestore().collection(reviewsTable).add(reviewToAdd);
    functions.logger.log("Added a review with ID: " + result);

    // Get all reviews for the reviewable.
    const reviewDocs = await admin.firestore().collection(reviewsTable)
        .where("reviewableId", "==", reviewToAdd.reviewableId).get();

    let recommendations = 0;
    reviewDocs.forEach((doc) => {
        const review = doc.data() as Review;

        if (review.recommended === true) {
            recommendations += 1;
        }
        });
    const totalReviews = reviewDocs.size;
    const newRecommendedPercentage= (recommendations / totalReviews) * 100;

    // Update the reviewables recommended percentage.
    // We could optimize this more by tracking review count + old average recommend %
    // (totalReviewCount * recPercentage) + newReviewRec / totalReviewCount
    admin.firestore().collection(reviewableTable).doc(reviewToAdd.reviewableId)
        .set({"recommendedPercentage": newRecommendedPercentage});

    console.log("Set reviewable:" + reviewToAdd.reviewableId + "recommended percentage to:" + newRecommendedPercentage);

    response.send("You made a review!!");
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
