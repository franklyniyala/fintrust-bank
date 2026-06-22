pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                credentialsId: 'GITHUB_LOGIN',
                url: 'https://github.com/franklyniyala/fintrust-bank.git'
            }
        }

        stage('Backend Unit Test') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }

        stage ('Frontend Unit Test') {
            steps {
                dir ('frontend') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }
    }

    post {
        success {
            echo '✅ Backend and Frontend Unit Tests Passed'
        }

        failure {
            echo '❌ Backend and Frontend Unit Tests Failed'
        }
    }
}