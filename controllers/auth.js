const User = require('../models/User')


exports.register = async (req, res , next) => {
    try{
        const { name, email, password } = req.body;

        const user = await User.create({
            name,
            email,
            password
        })

        const token = user.getSignedJwtToken();

        res.status(200).json({ 
            success: true, 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isPremium: user.isPremium,
                subscriptionPlan: user.subscriptionPlan
            }
        });
    }catch (error){
        res.status(400).json({ success: false, error: error.message })
    }
}

exports.login = async (req, res , next) => {
    try{
        const { email, password } = req.body;

        if(!email || !password){
            return res.status(400).json({ success: false, message: 'Please provide an email and password' })
        }

        const user = await User.findOne({ email }).select('+password');
        if(!user){
            return res.status(400).json({ success: false, message: 'Invalid credentials' })
        }

        const isMatch = await user.matchPassword(password);

        if(!isMatch){
            return res.status(400).json({ success: false, message: 'Invalid credentials' })
        }

        const token = user.getSignedJwtToken();

        res.status(200).json({ 
            success: true, 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isPremium: user.isPremium,
                subscriptionPlan: user.subscriptionPlan
            }
        });

    }catch (error){
        res.status(400).json({ success: false, error: error.message })
    }
}

exports.getMe = async (req, res , next) => {
    try{
        const user = await User.findById(req.user.id);

        res.status(200).json({ success: true, data: user })
    }catch (error){
        res.status(400).json({ success: false, error: error.message })
    }
}