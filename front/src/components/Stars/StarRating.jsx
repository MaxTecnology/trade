import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

const StarIcon = ({ index, rating }) => {
    const isHalfStar = index < rating && rating < index + 1;
    const isFullStar = index + 1 <= rating;

    if (isHalfStar) {
        return <FaStarHalfAlt color="yellow" />;
    } else if (isFullStar) {
        return <FaStar color="yellow" />;
    } else {
        return <FaRegStar />;
    }
};

const StarRating = ({ rating }) => {
    const totalStars = 5;

    return (
        <div className="flex gap-2">
            {[...Array(totalStars)].map((_, index) => (
                <StarIcon key={index} index={index} rating={rating} />
            ))}
        </div>
    );
};

export default StarRating;
