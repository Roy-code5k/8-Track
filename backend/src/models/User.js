import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: false, minlength: 6 },
        googleId: { type: String, unique: true, sparse: true },
        institution: { type: String, trim: true },
        branch: { type: String, trim: true },
        semester: { type: String, trim: true },
        dob: { type: Date },
        phone: { type: String, trim: true },
        avatarStyle: { type: String, default: 'avataaars' },
        avatarSeed: { type: String },
        pushSubscription: { type: Object },
        refreshToken: { type: String },
        googleTokens: {
            access_token: { type: String },
            refresh_token: { type: String },
            expiry_date: { type: Number },
        },
    },
    { timestamps: true }
);

// Hash password before saving (Mongoose v9: async hooks don't use next), PRE IS A MIDDLEWARE that happens before saving the document to the Database. 
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
